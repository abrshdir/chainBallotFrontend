import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hexToText',
  pure: true, // Keeps it efficient by preventing unnecessary recalculations,
  standalone: true,
})
export class HexToTextPipe implements PipeTransform {
  transform(hex: string): string {
    if (!hex || !hex.startsWith('0x')) return hex; // Return unchanged if invalid

    try {
      const bytes = new Uint8Array(
        hex.slice(2).match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );
      return new TextDecoder().decode(bytes);
    } catch (error) {
      console.error('Hex decoding failed:', error);
      return hex; // Return original string if decoding fails
    }
  }
}
