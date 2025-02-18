async function seoOptimization(videoId, title, description, tags) {
  const optimizedTitle = `SEO Optimizasyonlu ${title}`;
  const optimizedDescription = `${description}\nSEO Optimizasyonlu Açıklama`;
  const optimizedTags = [...tags, 'SEO', 'Optimizasyon'];

  console.log('SEO Optimizasyonu yapıldı:', {
    title: optimizedTitle,
    description: optimizedDescription,
    tags: optimizedTags,
  });

  return { title: optimizedTitle, description: optimizedDescription, tags: optimizedTags };
}

module.exports = seoOptimization;