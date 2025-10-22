// index.js
// Requires: node 18+, discord.js v14
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = '!';

// --- قائمة الرتب الكاملة (ادارية + رتب عائلية) ---
const rolesData = [
  { name: 'Owner', perms: PermissionsBitField.Flags.Administrator },
  { name: 'Founder', perms: PermissionsBitField.Flags.Administrator },
  { name: 'Co-Founder', perms: PermissionsBitField.Flags.ManageRoles | PermissionsBitField.Flags.ManageChannels },
  { name: 'Deputy', perms: PermissionsBitField.Flags.KickMembers | PermissionsBitField.Flags.BanMembers },
  { name: 'Senior Admin', perms: PermissionsBitField.Flags.ManageChannels | PermissionsBitField.Flags.ManageMessages },
  { name: 'Moderator', perms: PermissionsBitField.Flags.ManageMessages | PermissionsBitField.Flags.KickMembers },
  { name: 'Veteran', perms: 0 },
  { name: 'German Family', perms: 0 },
  { name: 'Recruit', perms: 0 },
  { name: 'VIP', perms: 0 },
  { name: 'Guest', perms: 0 },
  { name: 'Bot', perms: PermissionsBitField.Flags.SendMessages },

  // رتب عائلية زخرفية
  { name: 'Grandfather (الجد)', perms: 0 },
  { name: 'Grandmother (الجدة)', perms: 0 },
  { name: 'Father (الأب)', perms: 0 },
  { name: 'Mother (الأم)', perms: 0 },
  { name: 'Uncle (العم)', perms: 0 },
  { name: 'Aunt (العمة)', perms: 0 },
  { name: 'Maternal Uncle (الخال)', perms: 0 },
  { name: 'Maternal Aunt (الخالة)', perms: 0 },
  { name: 'Son (الابن)', perms: 0 },
  { name: 'Daughter (الابنة)', perms: 0 },
  { name: 'Cousin (ابن العم / ابن الخال)', perms: 0 },
  { name: 'Cousin (بنت العم / بنت الخال)', perms: 0 },
  { name: 'Nephew (ابن الأخ / ابن الأخت)', perms: 0 },
  { name: 'Niece (بنت الأخ / بنت الأخت)', perms: 0 },
  { name: 'Grandson (الحفيد)', perms: 0 },
  { name: 'Granddaughter (الحفيدة)', perms: 0 },
  { name: 'Family Elder (كبير العائلة)', perms: 0 },
  { name: 'Heir (الوريث)', perms: 0 },
  { name: 'Royal Blood (من سلالة العائلة)', perms: 0 },
  { name: 'Newborn (الوليد الجديد)', perms: 0 }
];

// --- Helper: create roles sequentially ---
async function ensureRoles(guild) {
  const created = {};
  for (const r of rolesData) {
    let role = guild.roles.cache.find(x => x.name === r.name);
    if (!role) {
      try {
        role = await guild.roles.create({ name: r.name, permissions: r.perms || 0, reason: 'Setup German Family roles' });
      } catch (e) {
        console.error('Failed to create role', r.name, e);
        continue;
      }
    }
    created[r.name] = role;
  }
  return created;
}

// --- Helper: create categories & channels with overwrites ---
async function createCategory(guild, name, overwrites=[]) {
  let cat = guild.channels.cache.find(c => c.name === name && c.type === 4);
  if (!cat) {
    cat = await guild.channels.create({ name, type: 4, permissionOverwrites: overwrites });
  }
  return cat;
}
async function createText(guild, name, parent, overwrites=[]) {
  let ch = guild.channels.cache.find(c => c.name === name && c.parent && c.parent.id === parent.id && c.type === 0);
  if (!ch) {
    ch = await guild.channels.create({ name, type: 0, parent: parent.id, permissionOverwrites: overwrites });
  }
  return ch;
}

client.on('ready', () => {
  console.log('Bot ready:', client.user.tag);
});

// Basic message commands
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const [cmd, ...args] = msg.content.slice(PREFIX.length).trim().split(/\s+/);

  // فقط الأدمن يقدر يشغّل !setup
  if (cmd === 'setup') {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return msg.reply('فقط الأدمن يقدر يشغّل !setup.');
    }

    const guild = msg.guild;
    await msg.channel.send('🔧 جاري إنشاء الرتب والقنوات... (انتظر ثواني قصيرة)');

    // 1) Roles
    const createdRoles = await ensureRoles(guild);

    // 2) Permission overwrites
    const everyone = guild.roles.everyone;
    const gfRole = createdRoles['German Family'];

    const welcomeOverwrites = [
      { id: everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] }
    ];
    const familyOverwrites = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: gfRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
    ];

    // Admin visibility
    const adminOverwrites = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: createdRoles['Founder'].id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: createdRoles['Owner'].id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
    ];

    try {
      // create categories & channels
      const welcomeCat = await createCategory(guild, 'WELCOME', welcomeOverwrites);
      await createText(guild, '👋-welcome', welcomeCat, welcomeOverwrites);
      await createText(guild, '📜-rules', welcomeCat, welcomeOverwrites);
      await createText(guild, '📝-apply-family', welcomeCat, welcomeOverwrites);
      await createText(guild, '🔒-verification', welcomeCat, welcomeOverwrites);

      const infoCat = await createCategory(guild, 'INFO', familyOverwrites);
      await createText(guild, '📢-announcements', infoCat, familyOverwrites);
      await createText(guild, '❓-faq', infoCat, familyOverwrites);

      const familyCat = await createCategory(guild, 'FAMILY HALL', familyOverwrites);
      await createText(guild, '💬-general', familyCat, familyOverwrites);
      await createText(guild, '🎮-games', familyCat, familyOverwrites);
      await createText(guild, '📸-media', familyCat, familyOverwrites);

      const appsCat = await createCategory(guild, 'APPLICATIONS', adminOverwrites);
      await createText(guild, '📝-applications', appsCat, adminOverwrites);
      await createText(guild, '✅-accepted', appsCat, adminOverwrites);

      const adminCat = await createCategory(guild, 'ADMIN & STAFF', adminOverwrites);
      await createText(guild, '🔐-admin-chat', adminCat, adminOverwrites);
      await createText(guild, '📁-staff-logs', adminCat, adminOverwrites);
      await createText(guild, '🛠️-setup-logs', adminCat, adminOverwrites);

      await msg.channel.send('✅ تم إنشاء الرتب والقنوات الأساسية. راجع صلاحيات الرتب في إعدادات السيرفر، وتأكد أن رتبة البوت أعلى من الرتب التي يحتاج يعطيها.');
    } catch (err) {
      console.error('Setup error', err);
      await msg.channel.send('❌ حصل خطأ أثناء إنشاء القنوات. شوف الكونسول للخطأ.');
    }
  }

  // --------------------------------------------------------------------------------
  // !verify -> طلب التحقق (يكتب العضو هذا الأمر في قناة verification)
  if (cmd === 'verify') {
    const guild = msg.guild;
    const member = msg.member;
    // تأكد أنه في قناة التفعيل
    if (!msg.channel.name.includes('verification') && !msg.channel.name.includes('apply-family')) {
      return msg.reply('استخدم هذا الأمر داخل قناة التحقق أو التقديم.');
    }
    // أرسل طلب للـ applications (embed مبسط كـ رسالة)
    const apps = guild.channels.cache.find(ch => ch.name.includes('applications'));
    if (!apps) return msg.reply('قناة applications مش موجودة — شغّل !setup أولاً.');

    const text = args.join(' ') || 'لا توجد معلومات إضافية.';
    const adminPing = `<@&${guild.roles.cache.find(r => r.name === 'Moderator')?.id || ''}>`;
    await apps.send({ content: `🆕 طلب تفعيل من: ${member.user.tag} — ${member} \nملاحظة: ${text}\n${adminPing}` });
    await msg.reply('تم إرسال طلب التفعيل للـ Moderation. انتظر مراجعتهم أو استخدم !apply مع التفاصيل لو حبيت.');
  }

  // !accept @user -> يقبل العضو ويعطيه German Family
  if (cmd === 'accept') {
    if (!msg.member.roles.cache.some(r => ['Founder','Owner','Co-Founder','Deputy','Senior Admin','Moderator'].includes(r.name))) {
      return msg.reply('ما عندك صلاحية القبول.');
    }
    const mention = msg.mentions.members.first();
    if (!mention) return msg.reply('اعمل منشن للشخص اللي تريد تقبله.');
    const role = msg.guild.roles.cache.find(r => r.name === 'German Family');
    if (!role) return msg.reply('رتبة German Family مش لاقيها — شغّل !setup.');

    try {
      await mention.roles.add(role);
      await msg.channel.send(`✅ ${mention.user.tag} تم منحه رتبة German Family.`);
      // logs
      const logs = msg.guild.channels.cache.find(c => c.name.includes('staff-logs'));
      if (logs) logs.send(`✅ ${msg.author.tag} accepted ${mention.user.tag} — gave German Family`);
    } catch (e) {
      console.error('Accept error', e);
      msg.reply('❌ فشل إضافة الرتبة. تأكد أن رتبة البوت أعلى من رتبة German Family.');
    }
  }

  // !reject @user <reason>
  if (cmd === 'reject') {
    if (!msg.member.roles.cache.some(r => ['Founder','Owner','Co-Founder','Deputy','Senior Admin','Moderator'].includes(r.name))) {
      return msg.reply('ما عندك صلاحية الرفض.');
    }
    const mention = msg.mentions.members.first();
    if (!mention) return msg.reply('اعمل منشن للشخص اللي تريد ترفُض طلبه.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    const apps = msg.guild.channels.cache.find(c => c.name.includes('applications'));
    if (apps) apps.send(`✖️ ${mention.user.tag} تم رفض طلبه - السبب: ${reason}`);
    await msg.channel.send(`✅ تم رفض ${mention.user.tag}.`);
  }

  // !setfamilyrole @user <RoleName> -> يعيّن رتبة زخرفية (مثل Father, Uncle...)
  if (cmd === 'setfamilyrole') {
    if (!msg.member.roles.cache.some(r => ['Founder','Owner','Co-Founder','Deputy','Senior Admin','Moderator'].includes(r.name))) {
      return msg.reply('ما عندك صلاحية لتعيين رتب عائلية.');
    }
    const mention = msg.mentions.members.first();
    if (!mention) return msg.reply('سوي منشن للشخص.');
    const roleName = args.slice(1).join(' ');
    if (!roleName) return msg.reply('اكتب اسم الرتبة بالضبط مثل "Father (الأب)" أو "Grandfather (الجد)".');
    const targetRole = msg.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!targetRole) return msg.reply('ما لقيت الرتبة. تأكد من اسمها أو شغّل !setup.');
    try {
      await mention.roles.add(targetRole);
      await msg.channel.send(`✅ ${mention.user.tag} الآن لديه رتبة "${targetRole.name}".`);
    } catch (e) {
      console.error('setfamilyrole error', e);
      msg.reply('❌ فشل تعيين الرتبة — تأكد أن رتبة البوت أعلى من الرتبة المراد تعيينها.');
    }
  }

  // !familytree -> يعرض الرتب العائلية (قائمة بسيطة)
  if (cmd === 'familytree') {
    const familyNames = rolesData.slice().filter(r=> r.name && r.name.match(/Grandfather|Grandmother|Father|Mother|Uncle|Aunt|Maternal|Son|Daughter|Cousin|Nephew|Niece|Grandson|Granddaughter|Family Elder|Heir|Royal Blood|Newborn|Newborn/)).map(r=> r.name);
    return msg.channel.send('🌳 **شجرة الرتب العائلية:**\n' + familyNames.join('\n'));
  }
});

client.login(process.env.TOKEN);
