from importlib import import_module

from oscar.core.loading import _pluck_classes, default_class_loader


def compat_class_loader(module_label, classnames, module_prefix):
    """
    Oscar 4.1 calls get_class("oscar.forms.widgets", ...) in some dashboard
    modules, but the default loader expects app-relative module labels.
    If a fully-qualified "oscar." module is passed, import it directly.
    """
    if module_label.startswith("oscar."):
        module = import_module(module_label)
        return _pluck_classes([module], classnames)
    return default_class_loader(module_label, classnames, module_prefix)
