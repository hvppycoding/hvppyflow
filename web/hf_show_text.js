import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Displays input text on a node, persisting data in properties
app.registerExtension({
	name: "hvppyflow.ShowText",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "HFShowTextNode") {
			function populate(textList) {
				if (!Array.isArray(textList)) textList = [textList];
				const existingCombo = this.widgets?.find(w => w.name === "text_index");
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
					// Use label "i / N" itself as combo value and keep label->index mapping
					let comboWidget = existingCombo;
					const buildLabels = (len) => Array.from({ length: len }, (_, i) => `${i + 1} / ${len}`);
					// Prepare mapping object (non-serialized)
					const rebuildMap = (labels) => {
						this._textLabelIndexMap = {};
						labels.forEach((lab, i) => { this._textLabelIndexMap[lab] = i; });
					};

					if (!comboWidget) {
						const labels = buildLabels(textList.length);
						rebuildMap(labels);
						comboWidget = this.addWidget("combo", "text_index", labels[0], () => {
							const idx = this._textLabelIndexMap[comboWidget.value] ?? 0;
							displayWidget.value = textList[idx];
						}, { values: labels });
						// Disable serialization (no need to persist selection)
						comboWidget.serialize = false;
						comboWidget.options.serialize = false;
					} else {
						// Rebuild labels/map if length changed; try to preserve previous selection
						if (comboWidget.options.values.length !== textList.length) {
							const prevLabel = comboWidget.value;
							const prevIndex = this._textLabelIndexMap?.[prevLabel] ?? 0;
							const labels = buildLabels(textList.length);
							comboWidget.options.values = labels;
							rebuildMap(labels);
							const newIndex = Math.min(prevIndex, textList.length - 1);
							comboWidget.value = labels[newIndex];
						}
					}

					ensureDisplayWidget();
					// Ensure combo widget is placed before the display widget
					if (comboWidget) {
						const comboIdx = this.widgets.indexOf(comboWidget);
						const displayIdx = this.widgets.indexOf(displayWidget);
						if (comboIdx !== -1 && displayIdx !== -1 && comboIdx > displayIdx) {
							// Move: remove combo then insert it before display widget
							this.widgets.splice(comboIdx, 1);
							const newDisplayIdx = this.widgets.indexOf(displayWidget); // Re-check index after removal
							this.widgets.splice(newDisplayIdx, 0, comboWidget);
						}
					}
					// Set display value initially or after update
					const currentIdx = this._textLabelIndexMap[comboWidget.value] ?? 0;
					displayWidget.value = textList[currentIdx];

					comboWidget.onChange = () => {
						const idx = this._textLabelIndexMap[comboWidget.value] ?? 0;
						displayWidget.value = textList[idx];
					};
				}

				requestAnimationFrame(() => {
					const sz = this.computeSize();
					if (sz[0] < this.size[0]) sz[0] = this.size[0];
					if (sz[1] < this.size[1]) sz[1] = this.size[1];
					this.onResize?.(sz);
					app.graph.setDirtyCanvas(true, false);
				});
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
