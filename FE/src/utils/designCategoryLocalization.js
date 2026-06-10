const categoryNameMap = {
  'Logo & Brand Identity': 'Logo & nhận diện thương hiệu',
  'Social Media Design': 'Thiết kế Social Media',
  'Packaging Design': 'Thiết kế bao bì',
  'UI/UX Design': 'Thiết kế UI/UX',
  'Print Design': 'Thiết kế ấn phẩm in',
  Illustration: 'Minh họa'
};

const categoryDescriptionMap = {
  'Create logos, brand guidelines, and cohesive identity systems for businesses.':
    'Thiết kế logo, guideline thương hiệu và hệ thống nhận diện đồng bộ cho doanh nghiệp.',
  'Produce posts, covers, and campaign assets for social media channels.':
    'Thiết kế bài đăng, ảnh bìa và asset chiến dịch cho các kênh social media.',
  'Develop packaging concepts, labels, and retail-ready visual systems.':
    'Phát triển concept bao bì, nhãn sản phẩm và hệ thống hình ảnh sẵn sàng đưa ra thị trường.',
  'Design app, website, and digital product experiences with user flows and interfaces.':
    'Thiết kế trải nghiệm app, website và sản phẩm số với user flow cùng giao diện rõ ràng.',
  'Create brochures, posters, flyers, menus, and other printed collateral.':
    'Thiết kế brochure, poster, flyer, menu và các ấn phẩm in phục vụ truyền thông.',
  'Craft custom illustrations, mascots, and visual storytelling assets.':
    'Thiết kế minh họa, mascot và hình ảnh kể chuyện theo nhu cầu thương hiệu.'
};

export function localizeDesignCategoryName(name) {
  if (!name) return '';
  return categoryNameMap[name] ?? name;
}

export function localizeDesignCategoryDescription(description) {
  if (!description) return '';
  return categoryDescriptionMap[description] ?? description;
}

export function buildLocalizedDesignCategoryLabel(category) {
  if (!category) return '';

  const name = localizeDesignCategoryName(category.name);
  const description = localizeDesignCategoryDescription(category.description);

  return description ? `${name} - ${description}` : name;
}
