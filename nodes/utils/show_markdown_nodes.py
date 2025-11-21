class HFShowMarkdownNode:
    """Display a list of input markdown strings and pass them through unchanged.

    Mirrors HFShowTextNode but intended for markdown rendering on the frontend.
    Uses INPUT_IS_LIST to receive entire list once; OUTPUT_IS_LIST so downstream
    nodes treat each element separately.

    @tool: show_markdown
    @capability: ui_passthrough
    """

    CATEGORY = "HF - utils"
    FUNCTION = "show_markdown"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("markdown",)
    OUTPUT_NODE = True
    OUTPUT_IS_LIST = (True,)
    INPUT_IS_LIST = True

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "markdown": ("STRING", {"forceInput": True, "multiline": True, "dynamicPrompts": False}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    def show_markdown(self, markdown, unique_id=None, extra_pnginfo=None):
        if not isinstance(markdown, list):
            markdown = [markdown]
        return {"ui": {"markdown": markdown}, "result": (markdown,)}