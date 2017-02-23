import { Octra2Page } from './app.po';

describe('octra2 App', function() {
  let page: Octra2Page;

  beforeEach(() => {
    page = new Octra2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
