import { OctraPage } from './app.po';

describe('octra App', () => {
  let page: OctraPage;

  beforeEach(() => {
    page = new OctraPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
