# hvppyflow — Unified Development Guide (All-in-One)

This repository uses a single guide. It consolidates node rules, core/utility module rules, security, performance, and testing into one file.

Important: Please write code, comments, and docs in English.

---

## 1) Node Development Guide

### 1.1 Basics
```python
class HFGenerateTextNode:
      """Generate text from a prompt using an LLM.

      Inputs: prompt(str), model(str), temperature(float), system_prompt(str)
      Outputs: text(str)

      @tool: llm_generate
      @capability: text_generation
      """

      CATEGORY = "HF - llm"
      FUNCTION = "generate_text"           # optional internal identifier
      RETURN_TYPES = ("STRING",)
      RETURN_NAMES = ("text",)
      OUTPUT_IS_LIST = (False,)

      @classmethod
      def INPUT_TYPES(cls):
            return {
                  "required": {
                        "prompt": ("STRING", {"multiline": True}),
                        "model": ("STRING", {"default": "gpt-4o-mini"}),
                        "temperature": ("FLOAT", {"default": 0.7, "min": 0.0, "max": 2.0, "step": 0.1}),
                  },
                  "optional": {
                        "system_prompt": ("STRING", {"multiline": True, "default": ""}),
                  }
            }

      def __init__(self, provider_registry: "LLMProviderRegistry") -> None:
            self.providers = provider_registry

      def generate_text(self, prompt: str, model: str, temperature: float, system_prompt: str = "") -> tuple[str]:
            provider = self.providers.get(model)
            text = provider.generate(prompt=prompt, system=system_prompt, temperature=temperature)
            return (text,)

      def IS_CHANGED(self) -> bool:
            return False
```

### 1.2 Inputs/Outputs and Widgets
- INPUT_TYPES returns `{ "required": {...}, "optional": {...} }`.
   - string: `( "STRING", { "multiline": True, "default": "" } )`
   - number: `( "INT" | "FLOAT", { "default": 0, "min": 0, "max": 1, "step": 0.1 } )`
   - choices: `( "STRING", { "choices": ["a","b"], "default": "a" } )`
   - force connection: `{ "forceInput": True }`
- Outputs must match `RETURN_TYPES`/`RETURN_NAMES` and return a tuple.
- List outputs: set `OUTPUT_IS_LIST = (True,)` and return a list at the same index.

### 1.3 Type Hints, Docstrings, Agent Metadata
- Apply type hints to all public methods; make return types explicit.
- Docstring first line is a concise summary; describe inputs/outputs next.
- Add agent-friendly tags at the end: `@tool: ...`, `@capability: ...`.

### 1.4 Errors
- Validation errors: raise `ValueError` or `HFNodeError`.
- External API failures: retries/backoff live in Provider layer; node surfaces final failure meaningfully.

### 1.5 Performance, Cache, Lazy Evaluation
- Use Provider-level LRU/TTL cache for identical inputs (prompt/model/temperature).
- For long-running jobs, consider lazy evaluation and progress logging.
- Control cache invalidation via `IS_CHANGED()` when needed.

### 1.6 Images/Masks/Tensors (Short)
- Internally tensor-based; mind device (CPU/GPU), dtype, normalization, channel order.
- Centralize conversions/normalization in helpers; document shapes/ranges.

### 1.7 List Semantics (`INPUT_IS_LIST` / `OUTPUT_IS_LIST`)
ComfyUI internally wraps every output in a single-element Python `list` so that its execution engine can uniformly handle sequential processing. Most of the time you can ignore this because the framework unwraps the value before it reaches your function.

There are two situations where list control matters:
1. You want to process multiple data items one-by-one in a single node invocation loop (automatic mapping).
2. You want your node to receive the entire list at once and manually handle batching/rebatching.

Key rules:
- By default each input arrives as a single item (not a list you need to iterate); Comfy wraps/unwraps transparently.
- If a node returns a Python `list` as an element of its result tuple, Comfy will normally treat that whole list as one item (it gets wrapped again). To tell Comfy this is a sequence of distinct items to be mapped over downstream, set `OUTPUT_IS_LIST = (True, ...)` for the corresponding positions.
- To receive the whole list of items in one call (instead of one call per element), set the class attribute `INPUT_IS_LIST = True`. This applies uniformly to all inputs—each required value arrives as a list whose length equals the number of data instances being processed. Scalar widget values must then be taken from index `0` (e.g. `batch_size = batch_size[0]`).
- When multiple input lists have different lengths, Comfy pads shorter ones by repeating the last element so all lists share the max length for mapping.
- The mapping loop lives in Comfy's execution engine (see `map_node_over_list` logic upstream). Your node only needs to implement either element-wise logic (default) or list-level logic (when `INPUT_IS_LIST = True`).

Practical patterns:
- Pass-through list node: declare `RETURN_TYPES = ("STRING",)` and `OUTPUT_IS_LIST = (True,)`; return a list of strings as the first tuple element.
- Rebatch node: set both `INPUT_IS_LIST = True` and `OUTPUT_IS_LIST = (True,)`; reshape or regroup items, then return a list.
- Mixed outputs: e.g. `("STRING", "INT")` with `OUTPUT_IS_LIST = (True, False)` makes the first output a mapped sequence and the second a single (repeated) scalar.

Common mistakes:
- Forgetting `OUTPUT_IS_LIST` leads to a list being treated as a single item (downstream nodes see one element containing the whole list).
- Setting `INPUT_IS_LIST = True` but not indexing scalar widget inputs (e.g. using `temperature` directly instead of `temperature[0]`).
- Returning mismatched list lengths across different outputs flagged as list-producing.

Minimal example (pass-through):
```python
class HFSimplePassNode:
   CATEGORY = "HF - utils"
   RETURN_TYPES = ("STRING",)
   OUTPUT_IS_LIST = (True,)
   FUNCTION = "forward"

   @classmethod
   def INPUT_TYPES(cls):
      return {"required": {"text": ("STRING", {"forceInput": True})}}

   def forward(self, text):
      # text is a single string; wrap into list for list output
      return ([text],)
```
Entire list consumption:
```python
class HFConsumeListNode:
   CATEGORY = "HF - utils"
   RETURN_TYPES = ("STRING",)
   OUTPUT_IS_LIST = (True,)
   INPUT_IS_LIST = True
   FUNCTION = "concat"

   @classmethod
   def INPUT_TYPES(cls):
      return {"required": {"text": ("STRING", {"forceInput": True})}}

   def concat(self, text):  # text is a list of strings
      joined = "\n".join(text)
      # Produce new per-item list (e.g. broadcast same joined result to each element)
      return ([joined for _ in text],)
```

---

## 2) Core/Utility Modules

### 2.1 Types and Naming
- Services (domain logic)
   - Class: `HF<Name>Service` (e.g., `HFLLMService`, `HFFilesService`)
   - File: `<name>_service.py` (e.g., `llm_service.py`)
- Providers (external integrations)
   - Interface: `LLMProvider` (e.g., `llm/providers.py`)
   - Implementations: `OpenAIProvider`, `OllamaProvider`, etc.
   - Registry: `LLMProviderRegistry` (model→provider mapping)
   - File: `<name>_provider.py` (e.g., `openai_provider.py`)
- Utilities (helpers)
   - File: `<area>_utils.py` (e.g., `token_utils.py`, `path_utils.py`)
- Settings: `HFSettings` (`settings.py`)
- Errors: `HFError`, `HFNodeError`, `HFConfigError`, `HFSecurityError`, `HFProviderError` (`errors.py`)
- Logging: `logging.py` or `log_utils.py` (structured logging)
- Filesystem sandbox: `fs/sandbox.py`, audit: `fs/audit.py`

### 2.2 Settings/Secrets
- Use `HFSettings` (pydantic `BaseSettings`) to load env, optional `.env`, and optional user config (`~/.config/hvppyflow/settings.json`).
- Optional hot reload via mtime watch and safe instance replacement.
- Never log secrets; mask (e.g., show first/last 4 chars only).

### 2.3 HTTP/Providers
- `httpx.AsyncClient` with timeouts and pooling; retries/backoff via `tenacity` on 429/5xx/network errors.
- Provider interface example:
```python
class LLMProvider(Protocol):
      async def generate(self, prompt: str, *, system: str | None = None,
                                  model: str, temperature: float = 0.7,
                                  stream: bool = False, **kwargs) -> str: ...
```
- The registry resolves `model`→provider; providers declare supported models.
- Token counting via `tiktoken` (or model-specific logic) for usage/cost estimates.

### 2.4 Cache/Rate Limit
- LRU/TTL cache keyed by prompt/model/temperature.
- Optional disk cache with hashed keys.
- Token-bucket or leaky-bucket rate limits per provider.

### 2.5 Concurrency
- Prefer asyncio for I/O; avoid blocking calls in async code.
- Protect shared resources with semaphores/locks.
- Apply per-call timeouts and graceful cancellation.

---

## 3) Filesystem Sandbox
- Allow operations only within `allowed_roots`.
- Normalize and validate paths:
   - `resolved = (base / user_path).resolve()`
   - Python 3.9+: `resolved.is_relative_to(base)` (for earlier versions, implement manually)
- Allowed ops: read/write/list/search (pattern-limited)
- Extension whitelist and file size caps.
- Audit log: `{timestamp, op, relative_path, session_id}`.

---

## 4) Logging/Observability
- Use structured (JSON) logging. Example fields: `event`, `module`, `session_id`, `duration_ms`, `tokens_in/out`, `model`, `cost_usd`.
- Never log raw prompts/secrets; mask if needed.

---

## 5) Testing Strategy
- Unit: per-node inputs/outputs/failures; sandbox negative cases (path traversal).
- Integration: mock providers to avoid network dependency.
- Async: `pytest-asyncio`; use `tmp_path` for filesystem tests.

---

## 6) Package Layout (shallow, recommended)
```
hvppyflow/
   llm/
      providers.py
      openai_provider.py
      token_utils.py
   fs/
      sandbox.py
      audit.py
   core/
      settings.py
      logging.py
      errors.py
   services/
      llm_service.py
   nodes/
      llm_generate_text_nodes.py
      filesystem_nodes.py
```

---

## 7) Agent Integration
- Expose tool-like functions with clear inputs/outputs/metadata.
```python
@dataclass
class ToolResult:
      ok: bool
      content: str | bytes | dict
      meta: dict[str, Any] = field(default_factory=dict)
```
- Add `@tool:` / `@capability:` tags to node docstrings for Agent parsing.

---

## 8) YAML Summary (Agent-parseable)
```yaml
naming:
   category: "HF - <group>"
   node_class: "HF<Name>Node"
   node_module: "*_nodes.py"
modules:
   services:
      class: "HF<Name>Service"
      file: "<name>_service.py"
   providers:
      interface: "LLMProvider"
      registry: "LLMProviderRegistry"
      file: "<name>_provider.py"
   utilities:
      file: "<area>_utils.py"
   config:
      class: "HFSettings"
      file: "settings.py"
   errors:
      base: "HFError"
      special:
         - HFNodeError
         - HFConfigError
         - HFSecurityError
         - HFProviderError
   fs:
      sandbox: "fs/sandbox.py"
      audit: "fs/audit.py"
policies:
   type_hints: "all public methods"
   logging: structured_json
   http: httpx_async + tenacity
   cache: lru_or_ttl
   rate_limit: token_bucket
   concurrency: asyncio
   testing: pytest + pytest-asyncio
security:
   secrets_logging: masked
   fs: allowed_roots + path_normalization
```

---

## 9) Workspace Example (Optional)

This is an example of how a developer might arrange external folders locally. It is not required for hvppyflow to work.

```
📂 workspaces
├ 📂 ComfyUI: https://github.com/comfyanonymous/ComfyUI.git
│  └ custom_nodes -> ../custom_nodes (symbolic link)
├ 📂 custom_nodes: symbolic links to custom nodes
├ 📂 hvppyflow: https://github.com/hvppycoding/hvppyflow.git
└ 📂 thirdparty_nodes: ...
    └ ComfyUI-Manager
...
├ 📂 [Optional] ComfyUI_frontend: https://github.com/Comfy-Org/ComfyUI_frontend.git
...
```

