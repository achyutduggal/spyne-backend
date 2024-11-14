const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Car     = require('../models/Car');
const multer  = require('multer');
const { storage, cloudinary } = require('../config/cloudinary');
const upload  = multer({ storage });

router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const imageFiles = req.files;
    const images = imageFiles.map((file) => file.path);

    if (images.length > 10) {
      return res.status(400).json({ message: 'Cannot upload more than 10 images' });
    }

    const car = new Car({
      title,
      description,
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      images,
      owner: req.user,
    });

    await car.save();
    res.status(201).json(car);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const keyword = req.query.q;
    let query = { owner: req.user };
    if (keyword) {
      const regex = new RegExp(keyword, 'i'); // case-insensitive
      query = {
        owner: req.user,
        $or: [{ title: regex }, { description: regex }, { tags: regex }],
      };
    }
    const cars = await Car.find(query);
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    if (car.owner.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(car);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    if (car.owner.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, description, tags } = req.body;
    const imageFiles = req.files;
    let images = car.images;

    if (imageFiles && imageFiles.length > 0) {
      const deletePromises = car.images.map(async (url) => {
        const publicId = getPublicIdFromUrl(url);
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);

      images = imageFiles.map((file) => file.path);
    }

    if (images.length > 10) {
      return res.status(400).json({ message: 'Cannot have more than 10 images' });
    }

    car.title       = title || car.title;
    car.description = description || car.description;
    car.tags        = tags ? tags.split(',').map((tag) => tag.trim()) : car.tags;
    car.images      = images;

    await car.save();
    res.json(car);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    if (car.owner.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const deletePromises = car.images.map(async (url) => {
      const publicId = getPublicIdFromUrl(url);
      return cloudinary.uploader.destroy(publicId);
    });
    await Promise.all(deletePromises);

    await car.remove();
    res.json({ message: 'Car removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

function getPublicIdFromUrl(url) {
  const urlParts = url.split('/');
  const imageName = urlParts[urlParts.length - 1].split('.')[0];
  const folder = 'car-images';
  const publicId = `${folder}/${imageName}`;
  return publicId;
}

module.exports = router;
