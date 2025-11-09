from .debug_nodes import HFDebug, HFSleep, HFSplitText

WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS = {
    "HFDebug": HFDebug,
    "HFSleep": HFSleep,
    "HFSplitText": HFSplitText,
}
