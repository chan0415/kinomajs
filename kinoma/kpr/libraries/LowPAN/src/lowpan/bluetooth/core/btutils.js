//@module
/*
 *     Copyright (C) 2010-2016 Marvell International Ltd.
 *     Copyright (C) 2002-2010 Kinoma, Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

/**
 * Kinoma LowPAN Framework: Kinoma Bluetooth Stack
 * Bluetooth v4.2 - Bluetooth Utilities
 */

const Utils = require("../../common/utils");
const Logger = Utils.Logger;
const Buffers = require("../../common/buffers");
const ByteBuffer = Buffers.ByteBuffer;

const BD_ADDR_SIZE = 6;
const BD_ADDR_SEPARATOR = ":";

const UUID_SIZE = 16;
const BASE_UUID = [
	0xFB, 0x34, 0x9B, 0x5F, 0x80, 0x00,
	0x00, 0x80,
	0x00, 0x10,
	0x00, 0x00,
	0x00, 0x00, 0x00, 0x00
];
const UUID_SEPARATOR = "-";

let logger = Logger.getLogger("BTUtils");

function toCharArray(str) {
	var ca = [];
	for (var i = 0; i < str.length; i++) {
		ca.push(str.charCodeAt(i));
	}
	return ca;
}
exports.toCharArray = toCharArray;

function isArrayEquals(a1, a2) {
	if (a1.length != a2.length) {
		return false;
	}
	return isArrayEquals2(a1, 0, a2, 0, a1.length);
}
exports.isArrayEquals = isArrayEquals;

function isArrayEquals2(a1, off1, a2, off2, len) {
	for (var i = 0; i < len; i++) {
		if (a1[i + off1] != a2[i + off2]) {
			return false;
		}
	}
	return true;
}
exports.isArrayEquals2 = isArrayEquals2;

exports.arrayIsZero = function (a, len = a.length) {
	for (let i = 0; i < len; i++) {
		if (a[i] != 0) {
			return false;
		}
	}
	return true;
};

exports.arrayXOR = function (a1, a2, len = a1.length) {
	let xrd = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		xrd[i] = a1[i] ^ a2[i];
	}
	return xrd;
};

exports.arraySwap = function (ar) {
	let sw = new Uint8Array(ar.length);
	for (let i = 0; i < sw.length; i++) {
		sw[i] = ar[sw.length - i - 1];
	}
	return sw;
};

/* TODO: LSB First only */
exports.arrayLeftShift = function (a, n, len = a.length) {
	let sf = new Uint8Array(a.length);
	let overflow = 0;
	for (let i = 0; i < len; i++) {
		let tmp = a[i] << n;
		sf[i] = (tmp | overflow) & 0xFF;
		overflow = tmp >>> 8;
	}
	return sf;
};

/**
 * A class represents Bluetooth UUID
 */
class UUID {
	constructor(byteArray) {
		this._array = byteArray;
	}
	/**
	 * Static function to create instance by byte array.
	 */
	static getByUUID(byteArray) {
		if (byteArray.length != UUID_SIZE
				&& byteArray.length != Utils.INT_16_SIZE) {
			return null;
		}
		return new UUID(byteArray);
	}
	/**
	 * Static function to create instance by 16-bit UUID.
	 */
	static getByUUID16(uuid16) {
		return new UUID(Utils.toByteArray(uuid16, 2, true));
	}
	/**
	 * Static function to create instance by string representation.
	 */
	static getByString(uuidString) {
		if (uuidString.length == 4) {
			/* UUID16 String */
			return UUID.getByUUID16(parseInt(uuidString, 16));
		}
		let buffer = ByteBuffer.allocate(16, true);
		let str = uuidString.split(UUID_SEPARATOR);
		buffer.putInt16(parseInt(str[4].substring(8, 12), 16));
		buffer.putInt16(parseInt(str[4].substring(4, 8), 16));
		buffer.putInt16(parseInt(str[4].substring(0, 4), 16));
		buffer.putInt16(parseInt(str[3], 16));
		buffer.putInt16(parseInt(str[2], 16));
		buffer.putInt16(parseInt(str[1], 16));
		buffer.putInt32(parseInt(str[0], 16));
		return new UUID(buffer.array);
	}
	/**
	 * Return true if this UUID is 16-bit UUID.
	 */
	isUUID16() {
		if (this._array.length == Utils.INT_16_SIZE) {
			return true;
		} else {
			return isArrayEquals2(this._array, 0, BASE_UUID, 0, UUID_SIZE - 4);
		}
	}
	/**
	 * Get 16-bit UUID.
	 */
	toUUID16() {
		let offset = 0;
		if (this._array.length == UUID_SIZE) {
			offset = 12;
		}
		return Utils.toInt(this._array, offset, Utils.INT_16_SIZE, true);
	}
	/**
	 * Get 128-bit UUID in byte array. If this UUID is 16-bit UUID, will convert.
	 */
	toUUID128() {
		if (this.isUUID16()) {
			let array = BASE_UUID.slice();
			array[12] = this._array[0];
			array[13] = this._array[1];
			array[14] = 0x00;
			array[15] = 0x00;
			return array;
		}
		return this._array;
	}
	/**
	 * Get string representation of this UUID.
	 */
	toString() {
		if (this.isUUID16()) {
			return Utils.toHexString(this.toUUID16(), 2, "");
		}
		let uuidArray = this.toUUID128();
		let str = Utils.toHexString(uuidArray[0], 1, "");
		for (let i = 1; i < UUID_SIZE; i++) {
			str = Utils.toHexString(uuidArray[i], 1, "") + str;
			if (i == 5 || i == 7 || i == 9 || i == 11) {
				str = UUID_SEPARATOR + str;
			}
		}
		return str;
	}
	/**
	 * Return raw array
	 */
	getRawArray() {
		return this._array;
	}
	/**
	 * Check if target equals to this UUID
	 */
	equals(target) {
		if (this == target) {
			return true;
		}
		if (!(target instanceof UUID)) {
			return false;
		}
		if (this.isUUID16() && target.isUUID16()) {
			return isArrayEquals(this._array, target._array);
		} else {
			return isArrayEquals(this.toUUID128(), target.toUUID128());
		}
	}
}
exports.UUID = UUID;

/**
 * A class represents Bluetooth address
 */
class BluetoothAddress {
	constructor(byteArray) {
		this._array = byteArray;
	}
	/**
	 * Static function to create instance by byte array
	 */
	static getByAddress(byteArray, random) {
		if (byteArray.length < BD_ADDR_SIZE) {
			return null;
		}
		if (byteArray.length >= (BD_ADDR_SIZE + 1)) {
			return new LEBluetoothAddress(byteArray.slice(0, BD_ADDR_SIZE),
				(byteArray[BD_ADDR_SIZE] == 0x01));
		}
		if (random !== undefined) {
			return new LEBluetoothAddress(byteArray, random);
		}
		return new BluetoothAddress(byteArray);
	}
	/**
	 * Static function to create instance by string representation.
	 */
	static getByString(addressString, random) {
		let byteArray = [];
		if (BD_ADDR_SEPARATOR.length > 0) {
			let ar = addressString.split(BD_ADDR_SEPARATOR);
			for (let i = (BD_ADDR_SIZE - 1); i >= 0; i--) {
				byteArray.push(parseInt(ar[i], 16));
			}
		} else {
			for (let i = (BD_ADDR_SIZE - 1); i >= 0; i--) {
				let pos = i * 2;
				byteArray.push(parseInt(addressString.substring(pos, pos + 2), 16));
			}
		}
		if (random !== undefined) {
			return new LEBluetoothAddress(byteArray, random);
		}
		return new BluetoothAddress(byteArray);
	}
	/**
	 * Get string representation of this address.
	 */
	toString() {
		let byteArray = this.getRawArray();
		let str = Utils.toHexString(byteArray[0], 1, "");
		for (let i = 1; i < BD_ADDR_SIZE; i++) {
			str = Utils.toHexString(byteArray[i], 1, "") + BD_ADDR_SEPARATOR + str;
		}
		return str;
	}
	/**
	 * Return raw array
	 */
	getRawArray() {
		return this._array;
	}
	/**
	 * Check if target equals to this BluetoothAddress
	 */
	equals(target) {
		if (this == target) {
			return true;
		}
		if (!(target instanceof BluetoothAddress)) {
			return false;
		}
		return isArrayEquals(this._array, target._array);
	}
}
exports.BluetoothAddress = BluetoothAddress;

const RANDOM_STATIC = 0x3;
const RANDOM_PRIVATE = 0x0;
const RANDOM_RESOLVABLE = 0x01;

class LEBluetoothAddress extends BluetoothAddress {
	constructor(byteArray, random = false) {
		super(byteArray);
		this._random = random;
	}
	get type() {
		return (this._array[BD_ADDR_SIZE - 1] >> 6) & 0x3;
	}
	get typeString() {
		if (!this._random) {
			return "public";
		}
		if (this.type == RANDOM_STATIC) {
			return "static";
		}
		if (this.type == RANDOM_RESOLVABLE) {
			return "resolvable";
		}
		return "private";
	}
	isRandom() {
		return this._random;
	}
	isIdentity() {
		return !this._random || (this.type == RANDOM_STATIC);
	}
	isResolvable() {
		return this._random && (this.type == RANDOM_RESOLVABLE);
	}
	equals(target) {
		if (target instanceof LEBluetoothAddress) {
			if (this.isRandom() != target.isRandom()) {
				return false;
			}
		}
		return super.equals(target);
	}
	toByteArray() {
		let array = new Uint8Array(BD_ADDR_SIZE + 1);
		array.set(this._array);
		array[BD_ADDR_SIZE] = this._random ? 0x01 : 0x00;
		return array;
	}
}

class MemoryBondingStorage {
	constructor() {
		this._bondings = new Array();
	}
	_allocateBond() {
		for (let i = 0; i < this._bondings.length; i++) {
			if (this._bondings[i] == null) {
				return i;
			}
		}
		return this._bondings.push(null) - 1;
	}
	addBond(index, info) {
		this._bondings[index] = info;
	}
	removeBond(index) {
		if (index < 0 || this._bondings.length <= index) {
			return;
		}
		this._bondings[index] = null;
	}
	getBond(index) {
		if (index < 0 || this._bondings.length <= index) {
			return null;
		}
		return this._bondings[index];
	}
	/* GAP Callback: Bonding Storage */
	storeBond(address, info) {
		let index = this._allocateBond();
		info.address = address;
		this.addBond(index, info);
	}
	/* GAP Callback: Bonding Storage */
	getBonds() {
		let results = new Array();
		for (let i = 0; i < this._bondings.length; i++) {
			if (this._bondings[i] != null) {
				results.push(this._bondings[i]);
			}
		}
		return results;
	}
	/* GAP Callback: Bonding Storage */
	findBondByAddress(address) {
		for (let i = 0; i < this._bondings.length; i++) {
			if (this._bondings[i] != null) {
				let address = this._bondings[i].address;
				if (address != null && address.equals(address)) {
					return this._bondings[i];
				}
			}
		}
		return null;
	}
}
exports.MemoryBondingStorage = MemoryBondingStorage;

class GAPConnectionManager {
	constructor() {
		this._connections = new Map();
		this._onAllDisconnected = null;
	}
	set onAllDisconnected(cb) {
		this._onAllDisconnected = cb;
	}
	disconnectAllConnections() {
		logger.debug("Disconnect all bearers...");
		let num = 0;
		this.forEachConnection(connection => {
			connection.disconnect(0x15);
			num++;
		});
		if (num == 0) {
			logger.debug("No bearers are active");
			if (this._onAllDisconnected != null) {
				this._onAllDisconnected();
			}
		} else {
			logger.debug("" + num + " disconnetion is pending.");
		}
	}
	registerConnection(connection) {
		if (this._connections.has(connection.handle)) {
			logger.warn("Connection is active: " + Utils.toHexString(connection.handle, 2));
		}
		this._connections.set(connection.handle, connection);
	}
	unregisterConnection(handle) {
		this._connections.delete(handle);
		if (this._connections.size == 0) {
			logger.debug("All bearers are disconnected.");
			if (this._onAllDisconnected != null) {
				this._onAllDisconnected();
			}
		}
	}
	forEachConnection(func) {
		this._connections.forEach((value, key, map) => {
			if (value != null && !value.isDisconnected()) {
				func(value);
			}
		});
	}
	getConnection(handle) {
		if (!this._connections.has(handle)) {
			return null;
		}
		let connection = this._connections.get(handle);
		if (connection.isDisconnected()) {
			logger.warn("Connection is disconnected");
			return null;
		}
		return connection;
	}
}
exports.GAPConnectionManager = GAPConnectionManager;