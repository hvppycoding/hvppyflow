import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Displays input text on a node, persisting data in properties
app.registerExtension({
	name: "hvppyflow.ShowText",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "HFShowTextNode") {
			function populate(textList) {
				// Normalize
				if (!Array.isArray(textList)) textList = [textList];
				// Early exit if identical to previous list (length + element equality)
				if (Array.isArray(this._lastTextList)) {
					const prev = this._lastTextList;
					if (prev.length === textList.length && prev.every((v,i)=>v===textList[i])) return;
				}
				const existingCombo = this.widgets?.find(w => w.name === "page");
				let displayWidget = this.widgets?.find(w => w.name === "text_display");

				// Helper to create display widget if absent
				const ensureDisplayWidget = () => {
					if (!displayWidget) {
						displayWidget = ComfyWidgets["STRING"](this, "text_display", ["STRING", { multiline: true }], app).widget;
						displayWidget.inputEl.readOnly = true;
						displayWidget.inputEl.style.opacity = 0.6;
						displayWidget.serialize = false;
						displayWidget.options.serialize = false;
					}
				};

				// If only one item: remove combo if it exists and show single widget
				if (textList.length === 1) {
					if (existingCombo) {
						// Remove combo widget cleanly
						const idx = this.widgets.indexOf(existingCombo);
						if (idx >= 0) {
							existingCombo.onRemove?.();
							this.widgets.splice(idx, 1);
						}
					}
					ensureDisplayWidget();
					displayWidget.value = textList[0];
				} else if (textList.length > 1) {
					// Always recreate combo widget (do not reuse old one)
					if (existingCombo) {
						const idx = this.widgets.indexOf(existingCombo);
						if (idx >= 0) {
							existingCombo.onRemove?.();
							this.widgets.splice(idx, 1);
						}
					}
					const buildLabels = (len) => Array.from({ length: len }, (_, i) => `${i + 1} / ${len}`);
					const labels = buildLabels(textList.length);
					// Build mapping before creating widget so callback can access it
					this._textLabelIndexMap = {};
					labels.forEach((lab,i)=>{ this._textLabelIndexMap[lab] = i; });

					ensureDisplayWidget();
					let comboWidget = this.addWidget("combo", "page", labels[0], () => {
						const idx = this._textLabelIndexMap[comboWidget.value] ?? 0;
						displayWidget.value = textList[idx];
					}, { values: labels });
					comboWidget.serialize = false;
					comboWidget.options.serialize = false;

					// Ensure combo before display
					const comboIdx = this.widgets.indexOf(comboWidget);
					const displayIdx = this.widgets.indexOf(displayWidget);
					if (comboIdx !== -1 && displayIdx !== -1 && comboIdx > displayIdx) {
						this.widgets.splice(comboIdx,1);
						const newDisplayIdx = this.widgets.indexOf(displayWidget);
						this.widgets.splice(newDisplayIdx,0,comboWidget);
					}

					// Initial display
					displayWidget.value = textList[0];
				}

				requestAnimationFrame(() => {
					const sz = this.computeSize();
					if (sz[0] < this.size[0]) sz[0] = this.size[0];
					if (sz[1] < this.size[1]) sz[1] = this.size[1];
					this.onResize?.(sz);
					app.graph.setDirtyCanvas(true, false);
				});

				// Snapshot list for future change detection
				this._lastTextList = textList.slice();
			}

			// When the node is executed, we receive the text in message.text
			const onExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function (message) {
				onExecuted?.apply(this, arguments);
				if (message?.text) {
					populate.call(this, message.text);
					this.properties = this.properties || {};
					this.properties["saved_text"] = message.text;
				}
			};

			// On configure (load from workflow), restore from properties
			const onConfigure = nodeType.prototype.onConfigure;
			nodeType.prototype.onConfigure = function () {
				onConfigure?.apply(this, arguments);
				if (this.properties?.["saved_text"]) {
					populate.call(this, this.properties["saved_text"]);
				}
			};
		}
	},
});
