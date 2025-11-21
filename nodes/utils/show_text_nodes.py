class HFShowTextNode:
    """Display a list of input strings and pass them through unchanged.

    Modes:
    - With INPUT_IS_LIST = True we receive the entire list in one call (not one call per element).
    - We also set OUTPUT_IS_LIST = True so downstream nodes treat each element of the returned list as separate items.
    - This avoids multiple onExecuted invocations for large lists and allows the JS extension to render all items at once.

    @tool: show_text
    @capability: ui_passthrough
    """

    CATEGORY = "HF - utils"
    FUNCTION = "show_text"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    OUTPUT_NODE = True
    OUTPUT_IS_LIST = (True,)
    INPUT_IS_LIST = True  # receive full list in a single execution

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"forceInput": True, "multiline": True, "dynamicPrompts": False}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    def show_text(self, text, unique_id=None, extra_pnginfo=None):
        # INPUT_IS_LIST=True guarantees text is a list; still normalize defensively.
        if not isinstance(text, list):
            text = [text]
        return {"ui": {"text": text}, "result": (text,)}
