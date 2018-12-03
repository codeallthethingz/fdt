const utils = require('./util');

test('parseFilters: simple', () => {
    expect(utils.parseFilters('hello')).toEqual([{ "token": "hello", "type": utils.POSITIVE }]);
});
test('parseFilters: negative', () => {
    expect(utils.parseFilters('-hello')).toEqual([{ "token": "hello", "type": utils.NEGATIVE }]);
});
test('parseFilters: phrased', () => {
    expect(utils.parseFilters('"hello world"')).toEqual([{ "token": "hello world", "type": utils.POSITIVE }]);
});
test('parseFilters: negative phrased', () => {
    expect(utils.parseFilters('-"hello world"')).toEqual([{ "token": "hello world", "type": utils.NEGATIVE }]);
});
test('parseFilters: negative three word phrased', () => {
    expect(utils.parseFilters('-"hello there world"')).toEqual([{ "token": "hello there world", "type": utils.NEGATIVE }]);
});
test('parseFilters: negative and positive', () => {
    expect(utils.parseFilters('-hello world')).toEqual([{ "token": "hello", "type": utils.NEGATIVE },
        { "token": "world", "type": utils.POSITIVE }
    ]);
});
test('parseFilters: negative and positive tokens', () => {
    expect(utils.parseFilters('-hello world "you look nice"')).toEqual([{ "token": "hello", "type": utils.NEGATIVE },
        { "token": "world", "type": utils.POSITIVE },
        { "token": "you look nice", "type": utils.POSITIVE }
    ]);
});
test('parseFilters: edge cases', () => {
    expect(utils.parseFilters()).toEqual([]);
    expect(utils.parseFilters('')).toEqual([]);
    expect(utils.parseFilters(null)).toEqual([]);
    expect(utils.parseFilters('  ')).toEqual([]);
    expect(utils.parseFilters(' ')).toEqual([]);
});

test('matchesFilter: simple', () => {
    var filters = utils.parseFilters('Hello')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'oh hello world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hello')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hell world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hellô world')).toEqual(false);
});

test('matchesFilter: negative', () => {
    var filters = utils.parseFilters('-Hello')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'oh hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hell world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hellô world')).toEqual(true);
});
test('matchesFilter: negative and positive', () => {
    var filters = utils.parseFilters('-Hello world')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'oh hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hell world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hellô world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'world hello')).toEqual(false);
});
test('matchesFilter: positive phrase', () => {
    var filters = utils.parseFilters('"Hello world"')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'oh hello world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hello')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hell world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hellô world')).toEqual(false);
});
test('matchesFilter: negative phrase', () => {
    var filters = utils.parseFilters('-"Hello world"')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'oh hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hell world')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hellô world')).toEqual(true);
});
test('matchesFilter: negative phrase two positive', () => {
    var filters = utils.parseFilters('-"Hello world" oh hi')
    expect(utils.matchesFilter(filters, 'hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'oh hi hello world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello hi oh')).toEqual(true);
    expect(utils.matchesFilter(filters, 'hello hi')).toEqual(false);
});
test('matchesFilter: two negative one positive', () => {
    var filters = utils.parseFilters('-hello -world hi')
    expect(utils.matchesFilter(filters, 'hello')).toEqual(false);
    expect(utils.matchesFilter(filters, 'world')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello world hi')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hello hi')).toEqual(false);
    expect(utils.matchesFilter(filters, 'world hi')).toEqual(false);
    expect(utils.matchesFilter(filters, 'hi')).toEqual(true);
});
test('iso: single digit tests', () => {
    expect(utils.iso(new Date('1995-01-01T03:24:00'))).toEqual("1995-01-01 03:24");
});
