const express = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/blogs (protected) — create a new post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, tag, body, status } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    }
    if (!body || body.trim().length < 20) {
      return res.status(400).json({ message: 'Body must be at least 20 characters.' });
    }

    const post = await Blog.create({
      title: title.trim(),
      tag: tag ? tag.trim() : 'Untagged',
      body: body.trim(),
      status: status === 'draft' ? 'draft' : 'published',
      author: req.user.id,
      authorName: req.user.name,
    });

    res.status(201).json({ message: 'Post saved.', post });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong while saving the post.' });
  }
});

// GET /api/blogs (protected) — list the logged-in user's posts
// Supports ?search= (matches title/body) and ?tag= (exact category match)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, tag } = req.query;
    const query = { author: req.user.id };

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ title: regex }, { body: regex }];
    }
    if (tag && tag.trim() && tag.trim().toLowerCase() !== 'all') {
      query.tag = new RegExp(`^${escapeRegex(tag.trim())}$`, 'i');
    }

    const posts = await Blog.find(query).sort({ updatedAt: -1 });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Could not load your posts.' });
  }
});

// GET /api/blogs/public — published posts for the home page (no auth)
// Supports ?search= (matches title/body) and ?tag= (exact category match)
router.get('/public', async (req, res) => {
  try {
    const { search, tag } = req.query;
    const query = { status: 'published' };

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ title: regex }, { body: regex }];
    }
    if (tag && tag.trim() && tag.trim().toLowerCase() !== 'all') {
      query.tag = new RegExp(`^${escapeRegex(tag.trim())}$`, 'i');
    }

    const posts = await Blog.find(query).sort({ updatedAt: -1 }).limit(30);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Could not load posts.' });
  }
});

// GET /api/blogs/public/tags — distinct list of tags among published posts (for the category filter)
router.get('/public/tags', async (req, res) => {
  try {
    const tags = await Blog.distinct('tag', { status: 'published' });
    res.json({ tags: tags.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ message: 'Could not load categories.' });
  }
});

// GET /api/blogs/public/:id — a single published post, for the detail page (no auth)
// Also increments the view count each time it's opened.
router.get('/public/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = await Blog.findOneAndUpdate(
      { _id: req.params.id, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Could not load this post.' });
  }
});

// GET /api/blogs/:id (protected) — the owner viewing/editing their own post (draft or published)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = await Blog.findOne({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Could not load this post.' });
  }
});

// PUT /api/blogs/:id (protected) — update a post
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = await Blog.findOne({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const { title, tag, body, status } = req.body;
    if (title && title.trim().length >= 3) post.title = title.trim();
    if (tag) post.tag = tag.trim();
    if (body && body.trim().length >= 20) post.body = body.trim();
    if (status === 'draft' || status === 'published') post.status = status;

    await post.save();
    res.json({ message: 'Post updated.', post });
  } catch (err) {
    res.status(500).json({ message: 'Could not update this post.' });
  }
});

// DELETE /api/blogs/:id (protected)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = await Blog.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete this post.' });
  }
});

module.exports = router;
