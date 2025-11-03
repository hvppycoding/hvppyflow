from comfy.comfy_types.node_typing import IO
import time

class HFDebug:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"forceInput": True}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        import logging
        logging.info("HPDebug - IS_CHANGED called with kwargs: %s", kwargs)
        text = kwargs.get("text")
        if isinstance(text, list):
            return tuple(text)
        return text

    INPUT_IS_LIST = True
    RETURN_TYPES = ("STRING",)
    FUNCTION = "notify"
    OUTPUT_NODE = True
    OUTPUT_IS_LIST = (True,)
    CATEGORY = "utils"

    def notify(self, text, unique_id=None):
        return {"ui": {"text": text}, "result": (text,)}

class HFSleep:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input": (IO.ANY, ),
                "minutes": ("INT", {"default": 0, "min": 0, "max": 1439}),
                "seconds": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 59.99, "step": 0.01}),
            },
        }

    RETURN_TYPES = (IO.ANY,)
    FUNCTION = "sleepdelay"
    CATEGORY = "misc"
    DESCRIPTION = "Delays the execution for the input amount of time."

    def sleepdelay(self, input, minutes, seconds):
        total_seconds = minutes * 60 + seconds
        time.sleep(total_seconds)
        return input,

class HFSplitText:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input": ("STRING", {"multiline": True}),
                "delimiter": ("STRING", {"default": ','}),
            },
        }

    RETURN_TYPES = ("STRING",)
    OUTPUT_IS_LIST = (True, )
    FUNCTION = "split"
    CATEGORY = "misc"

    def split(self, input, delimiter):
        if delimiter:
            return (input.split(delimiter), )
        return (input.split(), )
