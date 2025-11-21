from .debug_nodes import HFDebug, HFSleep, HFSplitText
from .nodes.utils.show_text_nodes import HFShowTextNode
from .nodes.utils.show_markdown_nodes import HFShowMarkdownNode

WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS = {
    "HFDebug": HFDebug,
    "HFSleep": HFSleep,
    "HFSplitText": HFSplitText,
    "HFShowTextNode": HFShowTextNode,
    "HFShowMarkdownNode": HFShowMarkdownNode,
}
