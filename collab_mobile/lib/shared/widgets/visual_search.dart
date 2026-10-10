import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_theme.dart';

class VisualSearchHelper {
  static final ImagePicker _picker = ImagePicker();

  static Future<void> startVisualSearch(BuildContext context, WidgetRef ref) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.camera_alt_rounded, color: AppColors.peacock, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'Search by Product Image',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.peacock.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.photo_camera_rounded, color: AppColors.peacock),
              ),
              title: const Text('Take a Photo', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('Snap product image with camera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            const SizedBox(height: 4),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.photo_library_rounded, color: Colors.purple),
              ),
              title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('Select saved product photo'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (file == null || !context.mounted) return;

      // Show scanning modal overlay
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => _VisualSearchScanningDialog(imagePath: file.path),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }
}

class _VisualSearchScanningDialog extends StatefulWidget {
  const _VisualSearchScanningDialog({required this.imagePath});
  final String imagePath;

  @override
  State<_VisualSearchScanningDialog> createState() => _VisualSearchScanningDialogState();
}

class _VisualSearchScanningDialogState extends State<_VisualSearchScanningDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _scannerCtrl;
  String _statusText = 'Analyzing image...';

  @override
  void initState() {
    super.initState();
    _scannerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _runScanSequence();
  }

  Future<void> _runScanSequence() async {
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _statusText = 'Extracting product features...');
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) setState(() => _statusText = 'Finding matching items...');
    await Future.delayed(const Duration(milliseconds: 700));

    if (mounted) {
      Navigator.pop(context);
      context.push('/products?title=Visual%20Search%20Results');
    }
  }

  @override
  void dispose() {
    _scannerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.center_focus_strong_rounded, color: AppColors.primary, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'Collabo Visual Lens',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 220,
                height: 220,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.file(
                      File(widget.imagePath),
                      fit: BoxFit.cover,
                    ),
                    Container(color: Colors.black.withOpacity(0.2)),
                    AnimatedBuilder(
                      animation: _scannerCtrl,
                      builder: (ctx, child) {
                        return Positioned(
                          top: _scannerCtrl.value * 190,
                          left: 0,
                          right: 0,
                          child: Container(
                            height: 3,
                            decoration: BoxDecoration(
                              color: AppColors.accentYellow,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accentYellow.withOpacity(0.9),
                                  blurRadius: 10,
                                  spreadRadius: 3,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    _statusText,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
