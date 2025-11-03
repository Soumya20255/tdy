const Product = require('../../models/Product');
const Category = require('../../models/Category');
const UploadService = require('../../services/uploadService');

// List all products
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false })
      .populate('category')
      .sort({ createdAt: -1 });

    res.render('admin/products/list', {
      title: 'Product Management',
      products
    });
  } catch (error) {
    console.error('List products error:', error);
    req.flash('error', 'Error loading products');
    res.redirect('/admin');
  }
};

// Show add product form
exports.showAddForm = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).sort({ name: 1 });

    res.render('admin/products/form', {
      title: 'Add Product',
      product: null,
      categories
    });
  } catch (error) {
    console.error('Show add form error:', error);
    req.flash('error', 'Error loading form');
    res.redirect('/admin/products');
  }
};

// Add new product
exports.addProduct = async (req, res) => {
  try {
    const { name, category, description, price } = req.body;

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      req.flash('error', 'At least one product image is required');
      return res.redirect('/admin/products/add');
    }

    // Extract filenames from uploaded files
    const imageFilenames = req.files.map(file => file.filename);

    const product = new Product({
      name,
      category,
      description,
      price: parseFloat(price),
      images: imageFilenames
    });

    await product.save();

    req.flash('success', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Add product error:', error);

    // Delete uploaded files if product creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        UploadService.deleteFile(file.filename);
      });
    }

    req.flash('error', 'Error adding product');
    res.redirect('/admin/products/add');
  }
};

// Show edit product form
exports.showEditForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    const categories = await Category.find({ isDeleted: false }).sort({ name: 1 });

    if (!product || product.isDeleted) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    res.render('admin/products/form', {
      title: 'Edit Product',
      product,
      categories
    });
  } catch (error) {
    console.error('Show edit form error:', error);
    req.flash('error', 'Error loading product');
    res.redirect('/admin/products');
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, category, description, price } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      req.flash('error', 'Product not found');

      // Delete uploaded files if any
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          UploadService.deleteFile(file.filename);
        });
      }

      return res.redirect('/admin/products');
    }

    // Update product fields
    product.name = name;
    product.category = category;
    product.description = description;
    product.price = parseFloat(price);

    // If new images are uploaded, delete old images and update
    if (req.files && req.files.length > 0) {
      // Delete old images
      product.images.forEach(image => {
        UploadService.deleteFile(image);
      });

      // Set new images
      product.images = req.files.map(file => file.filename);
    }

    await product.save();

    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);

    // Delete uploaded files if update failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        UploadService.deleteFile(file.filename);
      });
    }

    req.flash('error', 'Error updating product');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    // Delete all image files
    product.images.forEach(image => {
      UploadService.deleteFile(image);
    });

    // Soft delete the product
    await product.softDelete();

    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    req.flash('error', 'Error deleting product');
    res.redirect('/admin/products');
  }
};
