DROP TABLE IF EXISTS words;
CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY, datestr TEXT, word TEXT, explanation TEXT, wordtype TEXT);
INSERT INTO words (id, datestr, word, explanation, wordtype) VALUES (1, '2024-12-24', 'test-word', 'no info', 'no info');

DROP TABLE IF EXISTS coctails;
CREATE TABLE IF NOT EXISTS coctails (id INTEGER PRIMARY KEY, datestr TEXT, namestr TEXT, typestr TEXT, glass TEXT, ingredients TEXT, imageSrc TEXT);
INSERT INTO coctails (id, datestr, namestr, typestr, glass, ingredients, imageSrc) VALUES (1, '2024-12-24', 'Test', 'Coctail', 'High glass', '[Ice, Lemon]', 'https://www.thecocktaildb.com/images/media/drink/yzva7x1504820300.jpg');