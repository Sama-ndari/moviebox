import { PageMetaDto } from './page-meta-dto';
import { PageOptionsDto } from '../page-options-dto/page-options-dto';

describe('PageMetaDto', () => {
  it('should be defined', () => {
    const pageOptionsDto = new PageOptionsDto();
    const itemCount = 0;
    expect(new PageMetaDto({ pageOptionsDto, itemCount })).toBeDefined();
  });
});
