import { IInstagramPost } from '../../../core/types/instagram.js';
import { ISEOGenerator } from '../types.js';

export class SEOGenerator implements ISEOGenerator {
  private readonly serviceKeywords = [
    'brows',
    'powderbrows',
    'microblading',
    'lipblush',
    'eyeliner',
    'areola'
  ];

  public generateDescription(post: Partial<IInstagramPost>): string {
    const services = this.extractServices(post);
    const parts: string[] = [];

    if (services.size > 0) {
      parts.push(`Cosmetic tattoo ${Array.from(services).join(', ')}`);
    }

    if (post.caption) {
      const caption = post.caption.toLowerCase();
      if (caption.includes('vancouver')) parts.push('Vancouver WA');
      if (caption.includes('before') || caption.includes('after')) parts.push('results');
      if (caption.includes('heal')) parts.push('healing progress');
      if (caption.includes('touch up')) parts.push('touch-up');
    }

    let desc = parts.length > 0 ? 
      parts.join(' - ') : 
      'Professional cosmetic tattoo services';

    return `${desc}. Contact Pink Ink for appointments.`;
  }

  public extractHashtags(text: string): string[] {
    if (!text) return [];

    const hashtagRegex = /#[a-zA-Z][a-zA-Z0-9_]{2,29}(?![a-zA-Z0-9_])/g;
    const matches = text.match(hashtagRegex) || [];
    
    return [...new Set(matches)]
      .map(tag => tag.slice(1))
      .filter(tag => 
        tag.length >= 3 && 
        !/^[0-9a-fA-F]+$/.test(tag)
      );
  }

  private extractServices(post: Partial<IInstagramPost>): Set<string> {
    const services = new Set<string>();
    const text = [
      post.caption?.toLowerCase() || '',
      ...(post.hashtags?.map(tag => tag.toLowerCase()) || [])
    ].join(' ');

    this.serviceKeywords.forEach(keyword => {
      if (text.includes(keyword)) services.add(keyword);
    });

    return services;
  }
}
