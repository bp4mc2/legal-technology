class AssistantConfigurationError(RuntimeError):
    """Raised when the assistant runtime is not configured correctly."""


class SkillError(RuntimeError):
    """Raised for skill loading, parsing or routing errors."""


class SparqlValidationError(ValueError):
    """Raised when generated SPARQL violates backend policy."""
