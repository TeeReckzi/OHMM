Sunshine升级注意事项

# copy不支持PyObject
目前H73项目，在lib/copy下不支持copy的PyObject。所以，Meta/TypeMeta做了定制化。

# SunshineClient.py：
在SunshineClient中增加connectReady，后面升级时候，注意保留

# RainbowPluginClient.py
将GetExportTemplates的raise NotImplementedError，改成pass

#
