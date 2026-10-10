import 'dart:convert';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/config/env.dart';
import '../../core/theme/app_theme.dart';
import 'shimmer.dart';

/// Renders backend image fields, which may hold an absolute URL, a
/// site-relative path, or a base64 `data:` URI (Product.image is a TextField).
class AppImage extends StatelessWidget {
  const AppImage(
    this.source, {
    super.key,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.borderRadius,
    this.cacheWidth,
    this.semanticLabel,
    this.backgroundColor,
  });

  final String source;
  final BoxFit fit;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  /// Decode width in logical pixels; keeps memory low for thumbnails.
  final double? cacheWidth;
  final String? semanticLabel;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final dpr = MediaQuery.devicePixelRatioOf(context);
    final decodeWidth = cacheWidth == null ? null : (cacheWidth! * dpr).round();
    final src = source.trim();

    Widget child;
    if (src.isEmpty) {
      child = _Placeholder(width: width, height: height);
    } else if (src.startsWith('data:')) {
      final bytes = _Base64Cache.decode(src);
      child = bytes == null
          ? _Placeholder(width: width, height: height)
          : Image.memory(
              bytes,
              fit: fit,
              width: width,
              height: height,
              cacheWidth: decodeWidth,
              gaplessPlayback: true,
              semanticLabel: semanticLabel,
              errorBuilder: (_, _, _) => _Placeholder(width: width, height: height),
            );
    } else {
      child = CachedNetworkImage(
        imageUrl: resolveMediaUrl(src),
        fit: fit,
        width: width,
        height: height,
        memCacheWidth: decodeWidth,
        fadeInDuration: const Duration(milliseconds: 180),
        placeholder: (_, _) => Skeleton(width: width, height: height, radius: 0),
        errorWidget: (_, _, _) => _Placeholder(width: width, height: height),
      );
      if (semanticLabel != null) child = Semantics(image: true, label: semanticLabel, child: child);
    }

    if (backgroundColor != null) {
      child = ColoredBox(color: backgroundColor!, child: child);
    }
    if (borderRadius != null) {
      child = ClipRRect(borderRadius: borderRadius!, child: child);
    }
    return child;
  }
}

String resolveMediaUrl(String src) {
  if (src.startsWith('http://')) return 'https://${src.substring(7)}';
  if (src.startsWith('https://')) return src;
  if (src.startsWith('//')) return 'https:$src';
  return Env.origin.resolve(src.startsWith('/') ? src : '/$src').toString();
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({this.width, this.height});
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: context.palette.subtleSurface,
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined, color: context.palette.mutedText.withValues(alpha: 0.6)),
    );
  }
}

/// Decoding a large base64 string on every rebuild is expensive; keep a small LRU.
class _Base64Cache {
  static final _cache = <int, Uint8List>{};
  static const _max = 40;

  static Uint8List? decode(String dataUri) {
    final key = dataUri.hashCode ^ dataUri.length;
    final hit = _cache.remove(key);
    if (hit != null) return _cache[key] = hit;
    final comma = dataUri.indexOf(',');
    if (comma < 0) return null;
    try {
      final bytes = base64Decode(dataUri.substring(comma + 1).replaceAll(RegExp(r'\s'), ''));
      _cache[key] = bytes;
      if (_cache.length > _max) _cache.remove(_cache.keys.first);
      return bytes;
    } catch (_) {
      return null;
    }
  }
}
