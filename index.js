const PORT = process.env.PORT || 8000;
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const newsSources = [
    {
        name: 'hackernews',
        address: 'https://news.ycombinator.com/'
    }
];

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Tech News Aggregator API',
        endpoints: {
            allNews: '/news',
            specificSource: '/news/:sourceId'
        },
        availableSources: newsSources.map(s => s.name)
    });
});

app.get('/news', async (req, res) => {
    let allArticles = [];
    try {
        for (const source of newsSources) {
            const response = await axios.get(source.address);
            const html = response.data;
            const $ = cheerio.load(html);

            // Scrape Hacker News specific selectors
            if (source.name === 'hackernews') {
                $('.titleline > a', html).each(function() {
                    const title = $(this).text();
                    let url = $(this).attr('href');
                    if(url && !url.startsWith('http')) {
                        url = 'https://news.ycombinator.com/' + url;
                    }
                    allArticles.push({
                        title,
                        url,
                        source: source.name
                    });
                });
            }
        }
        res.json(allArticles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/news/:sourceId', async (req, res) => {
    const sourceId = req.params.sourceId;
    const source = newsSources.find(s => s.name === sourceId);

    if (source) {
        try {
            const response = await axios.get(source.address);
            const html = response.data;
            const $ = cheerio.load(html);
            const specificArticles = [];

            if (sourceId === 'hackernews') {
                $('.titleline > a', html).each(function() {
                    const title = $(this).text();
                    let url = $(this).attr('href');
                    if(url && !url.startsWith('http')) {
                        url = 'https://news.ycombinator.com/' + url;
                    }
                    specificArticles.push({
                        title,
                        url,
                        source: sourceId
                    });
                });
            }
            res.json(specificArticles);
        } catch(error) {
             console.error(error);
             res.status(500).json({ error: 'Failed to fetch news from specific source' });
        }
    } else {
        res.status(404).json({ error: 'Source not found' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
}

module.exports = app;
