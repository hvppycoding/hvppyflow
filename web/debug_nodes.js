import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "hvppyflow.debug_nodes",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "HFDebug") {
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function (message) {
                console.log("HFDebug - message:", message);
                console.log("HFDebug - this", this);
                onExecuted?.apply(this, arguments);

                if (this.widgets) {
					for (let i = 0; i < this.widgets.length; i++) {
						this.widgets[i].onRemove?.();
					}
					this.widgets.length = 0;
				}

                // Check if the "text" widget already exists.
                let textWidget = this.widgets && this.widgets.find(w => w.name === "displaytext");
                if (!textWidget) {
                    textWidget = ComfyWidgets["STRING"](this, "displaytext", ["STRING", { multiline: true }], app).widget;
                    textWidget.inputEl.readOnly = true;
                    textWidget.inputEl.style.border = "none";
                    textWidget.inputEl.style.backgroundColor = "transparent";
                    textWidget.serialize = false;
                    textWidget.options.serialize = false; // Prevent prompt serialization
                }
                textWidget.value = message["text"].join("");
            };
        }
    },
});