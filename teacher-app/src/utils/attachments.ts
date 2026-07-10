import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '@/types';
import { colors } from '@theme';

export function attachmentIcon(type: Attachment['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'pdf':
      return 'document-text';
    case 'image':
      return 'image';
    case 'video':
      return 'play-circle';
    case 'doc':
      return 'document';
    case 'link':
      return 'link';
    default:
      return 'attach';
  }
}

export function attachmentColor(type: Attachment['type']): string {
  switch (type) {
    case 'pdf':
      return colors.accentRose;
    case 'image':
      return colors.accentEmerald;
    case 'video':
      return colors.accentViolet;
    case 'doc':
      return colors.accentSky;
    case 'link':
      return colors.accentAmber;
    default:
      return colors.textSecondary;
  }
}
