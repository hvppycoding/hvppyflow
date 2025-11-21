import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Displays input markdown on a node, persisting data in properties
app.registerExtension({
	name: "hvppyflow.ShowMarkdown",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "HFShowMarkdownNode") {
			function populate(mdList) {
				// Normalize
				if (!Array.isArray(mdList)) mdList = [mdList];
				// Early exit if identical to previous list
				if (Array.isArray(this._lastMarkdownList)) {
					const prev = this._lastMarkdownList;
					if (prev.length === mdList.length && prev.every((v,i)=>v===mdList[i])) return;
				}
				const existingCombo = this.widgets?.find(w => w.name === "page");
				let displayWidget = this.widgets?.find(w => w.name === "markdown_display");

				const ensureDisplayWidget = () => {
					if (!displayWidget) {
						displayWidget = ComfyWidgets["MARKDOWN"](this, "markdown_display", ["STRING"], app).widget;
						displayWidget.serialize = false;
						displayWidget.options.serialize = false;
                        console.log("Created markdown display widget", displayWidget);
					}
				};

				if (mdList.length === 1) {
					if (existingCombo) {
						const idx = this.widgets.indexOf(existingCombo);
						if (idx >= 0) {
							existingCombo.onRemove?.();
							this.widgets.splice(idx, 1);
						}
					}
					ensureDisplayWidget();
					displayWidget.value = mdList[0];
				} else if (mdList.length > 1) {
					// Always recreate combo
					if (existingCombo) {
						const idx = this.widgets.indexOf(existingCombo);
						if (idx >= 0) {
							existingCombo.onRemove?.();
							this.widgets.splice(idx, 1);
						}
					}
					const buildLabels = (len) => Array.from({ length: len }, (_, i) => `${i + 1} / ${len}`);
					const labels = buildLabels(mdList.length);
					this._mdLabelIndexMap = {};
					labels.forEach((lab,i)=>{ this._mdLabelIndexMap[lab] = i; });

					ensureDisplayWidget();
					let comboWidget = this.addWidget("combo", "page", labels[0], () => {
						const idx = this._mdLabelIndexMap[comboWidget.value] ?? 0;
						displayWidget.value = mdList[idx];
					}, { values: labels });
					comboWidget.serialize = false;
					comboWidget.options.serialize = false;

					// Ensure ordering
					const comboIdx = this.widgets.indexOf(comboWidget);
					const displayIdx = this.widgets.indexOf(displayWidget);
					if (comboIdx !== -1 && displayIdx !== -1 && comboIdx > displayIdx) {
						this.widgets.splice(comboIdx,1);
						const newDisplayIdx = this.widgets.indexOf(displayWidget);
						this.widgets.splice(newDisplayIdx,0,comboWidget);
					}

					displayWidget.value = mdList[0];
				}

				requestAnimationFrame(() => {
					const sz = this.computeSize();
					if (sz[0] < this.size[0]) sz[0] = this.size[0];
					if (sz[1] < this.size[1]) sz[1] = this.size[1];
					this.onResize?.(sz);
					app.graph.setDirtyCanvas(true, false);
				});

				this._lastMarkdownList = mdList.slice();
			}

			const onExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function (message) {
				onExecuted?.apply(this, arguments);
				if (message?.markdown) {
					populate.call(this, message.markdown);
					this.properties = this.properties || {};
					this.properties["saved_markdown"] = message.markdown;
				}
			};

			const onConfigure = nodeType.prototype.onConfigure;
			nodeType.prototype.onConfigure = function () {
				onConfigure?.apply(this, arguments);
				if (this.properties?.["saved_markdown"]) {
					populate.call(this, this.properties["saved_markdown"]);
				}
			};
		}
	},
});
