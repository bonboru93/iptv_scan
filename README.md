# iptv-scan

`iptv-scan` 是一个用于扫描 IPTV 源的工具，方便快速批量检测 IPTV 源的可用性。

## 使用方法

```bash
npx iptv-scan -p <地址前缀> -s <开始ID> -e <结束ID>
```

## 参数说明

- `-p <地址前缀>`: 必填，指定 IPTV 源地址的前缀，例如 `http://ott.chinamobile.com/PLTV/88888888`。
- `-s <开始ID>`: 必填，指定扫描的起始 ID。
- `-e <结束ID>`: 必填，指定扫描的结束 ID。

地址模式：http://地址前缀/ID/index.m3u8

## 输出格式

扫描完成后，会弹出网页，列出所有源、片段和码率。

![](https://github.com/bonboru93/iptv_scan/raw/master/example.png)

接着，你可以：

- 查看扫描结果。
- 为每个源命名。
- 导出源列表。
