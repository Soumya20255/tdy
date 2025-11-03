const Category = require('../../models/Category');

// List all categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).sort({ createdAt: -1 });

    res.render('admin/categories/list', {
      title: 'Category Management',
      categories
    });
  } catch (error) {
    console.error('List categories error:', error);
    req.flash('error', 'Error loading categories');
    res.redirect('/admin');
  }
};

// Show add category form
exports.showAddForm = (req, res) => {
  res.render('admin/categories/form', {
    title: 'Add Category',
    category: null
  });
};

// Add new category
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log('DEBUG addCategory req.body ->', { name, description });

    // Check if category already exists (active)
    const existingActiveCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isDeleted: false
    });

    if (existingActiveCategory) {
      req.flash('error', 'Category with this name already exists');
      return res.redirect('/admin/categories/add');
    }

    // Check if a deleted category with same name exists
    const deletedCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isDeleted: true
    });

    if (deletedCategory) {
      // Reactivate the deleted category with new description
      deletedCategory.isDeleted = false;
      deletedCategory.description = description;
      await deletedCategory.save();

      req.flash('success', 'Category reactivated successfully');
      res.redirect('/admin/categories');
    } else {
      // Create new category
      const category = new Category({ name, description });
      await category.save();

      req.flash('success', 'Category added successfully');
      res.redirect('/admin/categories');
    }
  } catch (error) {
    console.error('Add category error:', error);
    req.flash('error', 'Error adding category');
    res.redirect('/admin/categories/add');
  }
};

// Show edit category form
exports.showEditForm = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || category.isDeleted) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    res.render('admin/categories/form', {
      title: 'Edit Category',
      category
    });
  } catch (error) {
    console.error('Show edit form error:', error);
    req.flash('error', 'Error loading category');
    res.redirect('/admin/categories');
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category || category.isDeleted) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    // Check if another category with same name exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id },
      isDeleted: false
    });

    if (existingCategory) {
      req.flash('error', 'Category with this name already exists');
      return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }

    category.name = name;
    category.description = description;
    await category.save();

    req.flash('success', 'Category updated successfully');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Update category error:', error);
    req.flash('error', 'Error updating category');
    res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
};

// Delete category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || category.isDeleted) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    await category.softDelete();

    req.flash('success', 'Category deleted successfully');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Delete category error:', error);
    req.flash('error', 'Error deleting category');
    res.redirect('/admin/categories');
  }
};
