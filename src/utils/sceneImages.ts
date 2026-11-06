// Curated, high-resolution distinct Unsplash photo collections for each category/figure type
// Ensures every single scene (Scene 1 ~ Scene 12) has a completely distinct, stunning, relevant photo.

export interface CuratedPhotoPool {
  [category: string]: string[];
}

export const CATEGORY_PHOTO_POOLS: CuratedPhotoPool = {
  // Food / Chef / Dining / Restaurant (안성재, 백종원, 파인다이닝, 흑백요리사 등)
  culinary: [
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1080&q=85', // Chef in professional white jacket
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&q=85', // Chef cooking intensely in kitchen
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=85', // Desert soldier / rugged military theme
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=85', // Vintage reflective sepia / humble beginnings
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1080&q=85', // Culinary training / focused knife skills
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1080&q=85', // High-end kitchen team under pressure
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1080&q=85', // Exquisite Michelin-level plated dish
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1080&q=85', // Elegant fine-dining restaurant atmosphere
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1080&q=85', // Interview / media spotlight moment
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1080&q=85', // Confident master chef portrait in suit
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1080&q=85', // Inspiring radiant smile of triumph
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1080&q=85', // Table feast / celebration
  ],

  // Sports / Athletic / Soccer / Overcoming (손흥민, 운동선수, 챔피언 등)
  sports: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1080&q=85', // Stadium floodlights & epic pitch
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1080&q=85', // Intense athletic sprint / sweat
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1080&q=85', // Track runner determined eyes
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1080&q=85', // Lone practice in cold dusk
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1080&q=85', // Soccer ball on pitch grass
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1080&q=85', // Roaring stadium crowd
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1080&q=85', // Grit and endurance
    'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=1080&q=85', // Trophy & golden victory
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1080&q=85', // Exhausted but proud champion
    'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1080&q=85', // Sunset stadium training
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1080&q=85', // Pure focus and speed
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1080&q=85', // Standing ovation
  ],

  // Entertainment / K-Pop / Music / Global (로제, 아이돌, 배우, 인플루언서)
  entertainment: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1080&q=85', // Concert stage lights & laser show
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&q=85', // Dazzling festival stage
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1080&q=85', // Electric music mixing console
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1080&q=85', // Vintage acoustic guitar & mic
    'https://images.unsplash.com/photo-1520523839898-50712825e617?auto=format&fit=crop&w=1080&q=85', // Grand piano in moody spotlight
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1080&q=85', // Singing with heartfelt passion
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1080&q=85', // Thousands of glowing crowd lights
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1080&q=85', // Youthful celebration & friendship
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1080&q=85', // Striking high-fashion magazine portrait
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1080&q=85', // Confetti falling on big finale
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1080&q=85', // Acoustic songwriting session
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1080&q=85', // Golden hour stardom
  ],

  // Business / Tech / Startup / Visionary (일론 머스크, 기업인, 혁신가)
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=85', // Modern skyscraper looking upward
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&q=85', // Confident executive in suit
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1080&q=85', // Tech team collaborating on laptops
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=85', // Futuristic digital earth network
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1080&q=85', // Startup brainstorming whiteboard
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1080&q=85', // High fives after breakthrough
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1080&q=85', // Server room futuristic data
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&q=85', // Code & AI matrix
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1080&q=85', // Keynote stage presentation
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1080&q=85', // Boardroom vision
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1080&q=85', // Strategy and execution
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1080&q=85', // Mobile innovation
  ],

  // General / Life Story / Overcoming Adversity (인생 역전, 감동 실화, 다큐)
  general: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85', // Dramatic mountain road / epic journey
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=85', // Sun breaking through stormy clouds
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1080&q=85', // Peaceful sunrise / hope
    'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1080&q=85', // Historic Tokyo/Seoul night lights
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1080&q=85', // Emotional gaze portrait
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1080&q=85', // Mature reflective figure
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1080&q=85', // Late night hard work
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1080&q=85', // Turning the page / notebook
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1080&q=85', // Together moving forward
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1080&q=85', // Open field of freedom
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1080&q=85', // Confetti and triumph
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1080&q=85', // Bright hopeful smile
  ]
};

/**
 * Returns a guaranteed distinct, high-quality, category-matched image URL
 * for any given scene index. Each scene from 0 to 11 receives a unique photo.
 */
export function getSceneFallbackImage(
  figureName: string = '',
  category: string = 'entertainment',
  sceneIndex: number = 0
): string {
  const normFigure = figureName.toLowerCase();
  let poolKey = 'general';

  // Chef / Cooking detection
  if (
    normFigure.includes('셰프') ||
    normFigure.includes('안성재') ||
    normFigure.includes('백종원') ||
    normFigure.includes('요리') ||
    normFigure.includes('모수') ||
    normFigure.includes('chef') ||
    category === 'culinary' ||
    category === 'food'
  ) {
    poolKey = 'culinary';
  } else if (
    normFigure.includes('손흥민') ||
    normFigure.includes('이강인') ||
    normFigure.includes('페이커') ||
    normFigure.includes('선수') ||
    category === 'sports'
  ) {
    poolKey = 'sports';
  } else if (
    normFigure.includes('머스크') ||
    normFigure.includes('잡스') ||
    normFigure.includes('대표') ||
    category === 'business' ||
    category === 'tech'
  ) {
    poolKey = 'business';
  } else if (
    category === 'entertainment' ||
    category === 'global' ||
    normFigure.includes('로제') ||
    normFigure.includes('아이유') ||
    normFigure.includes('bts')
  ) {
    poolKey = 'entertainment';
  }

  const pool = CATEGORY_PHOTO_POOLS[poolKey] || CATEGORY_PHOTO_POOLS.general;
  const safeIdx = Math.abs(sceneIndex) % pool.length;
  return pool[safeIdx];
}
