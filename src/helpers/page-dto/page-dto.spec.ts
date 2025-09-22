import { PageDto } from './page-dto';
import { PageMetaDto } from '../page-meta-dto/page-meta-dto';
import { PageOptionsDto } from '../page-options-dto/page-options-dto';

describe('PageDto', () => {
  it('should be defined', () => {
    const pageOptionsDto = new PageOptionsDto();
    const itemCount = 0;
    const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });
    expect(new PageDto([], pageMetaDto)).toBeDefined();
  });
});
