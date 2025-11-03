import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "hvppyflow.debug_nodes",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "HFDebug") {
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function (message) {
                onExecuted?.apply(this, arguments);

                this.properties.text = message["text"]

                let comboWidget = this.widgets && this.widgets.find(w => w.name === "displayindex");
                let textWidget = this.widgets && this.widgets.find(w => w.name === "displaytext");
                if (!comboWidget) {
                    comboWidget = this.addWidget("combo", "displayindex", 0, () => {
                        comboWidget.value = Math.min(comboWidget.value, comboWidget.options.values.length - 1);
                        textWidget.value = message["text"]?.[comboWidget.value];       
                    }, {values: Array.from({ length: message["text"].length }, (_, i) => i)});
                    comboWidget.value = 0;
                } 
                if (!textWidget) {
                    textWidget = ComfyWidgets["STRING"](this, "displaytext", ["STRING", { multiline: true }], app).widget;
                    textWidget.inputEl.readOnly = true;
                    textWidget.inputEl.style.border = "none";
                    textWidget.inputEl.style.backgroundColor = "transparent";
                    textWidget.serialize = false;
                    textWidget.options.serialize = false; // Prevent prompt serialization
                }
                
                if (comboWidget.options.values.length !== message["text"].length) {
                    comboWidget.options.values = Array.from({ length: message["text"].length }, (_, i) => i);
                    comboWidget.value = Math.min(comboWidget.value, comboWidget.options.values.length - 1);
                }
                textWidget.value = message["text"]?.[comboWidget.value];

                comboWidget.onChange = (data) => {
                    console.log("Combo changed" + comboWidget.value);
                    const index = comboWidget.value;
                    textWidget.value = message["text"]?.[index];
                };
            };

            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function () {
                onConfigure?.apply(this, arguments);
                
                let comboWidget = this.widgets && this.widgets.find(w => w.name === "displayindex");
                let textWidget = this.widgets && this.widgets.find(w => w.name === "displaytext");
                if (!comboWidget) {
                    comboWidget = this.addWidget("combo", "displayindex", 0, () => {
                        comboWidget.value = Math.min(comboWidget.value, comboWidget.options.values.length - 1);
                        textWidget.value = this.properties?.text?.[comboWidget.value];
                    }, {values: Array.from({ length: this.properties?.text.length ?? 0 }, (_, i) => i)});
                    comboWidget.value = 0;
                }
                if (!textWidget) {
                    textWidget = ComfyWidgets["STRING"](this, "displaytext", ["STRING", { multiline: true }], app).widget;
                    textWidget.inputEl.readOnly = true;
                    textWidget.inputEl.style.border = "none";
                    textWidget.inputEl.style.backgroundColor = "transparent";
                    textWidget.serialize = false;
                    textWidget.options.serialize = false; // Prevent prompt serialization
                }

                if (comboWidget.options.values.length !== this.properties?.text.length) {
                    comboWidget.options.values = Array.from({ length: this.properties?.text.length }, (_, i) => i);
                    comboWidget.value = Math.min(comboWidget.value, comboWidget.options.values.length - 1);
                }

                comboWidget.onChange = (data) => {
                    console.log("Combo changed" + comboWidget.value);
                    const index = comboWidget.value;
                    textWidget.value = this.properties?.text?.[index];
                };

                if (this.properties?.text) {
                    textWidget.value = this.properties?.text?.[comboWidget.value];
                }
            };
        }
    },
});