#
#     Copyright (C) 2010-2016 Marvell International Ltd.
#     Copyright (C) 2002-2010 Kinoma, Inc.
#
#     Licensed under the Apache License, Version 2.0 (the "License");
#     you may not use this file except in compliance with the License.
#     You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#     Unless required by applicable law or agreed to in writing, software
#     distributed under the License is distributed on an "AS IS" BASIS,
#     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#     See the License for the specific language governing permissions and
#     limitations under the License.
#
SETUP_JS_SRCS = connect.js _download.js download.js scan.js description.js config.js rssi.js ssid.js app.js

SETUP_BINARIES = $(addprefix $(DEST_DIR)/setup/, $(addsuffix .xsb, $(basename $(SETUP_JS_SRCS))))

SETUP_DIR = $(F_HOME)/xs6/sources/mc/extensions/setup

.PHONY: archive

all: archive

archive: $(TMP_DIR)/setup $(DEST_DIR)/setup $(SETUP_BINARIES)

$(TMP_DIR)/setup:
	mkdir -p $(TMP_DIR)/setup
$(DEST_DIR)/setup:
	mkdir -p $(DEST_DIR)/setup

# rules
$(DEST_DIR)/setup/%.xsb: $(TMP_DIR)/setup/%.xsb
	cp -p $< $@
$(TMP_DIR)/setup/%.xsb: $(SETUP_DIR)/%.js
	$(XS6_TOOL_DIR)/xsc6 $(XSC_OPTIONS) -c -o $(TMP_DIR)/setup $<

clean:
