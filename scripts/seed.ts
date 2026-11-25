import fs from "fs";
import path from "path";
import { loadEnv } from "./load-env";
import { writeSeedArt } from "./seed-art";

loadEnv();

const password = "lantern-demo";

function html(paragraphs: string[]) {
  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

async function main() {
  await writeSeedArt();
  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = await import("bcryptjs");
  const { storagePut } = await import("../lib/storage");
  const prisma = new PrismaClient();
  const reset = process.argv.includes("--reset");
  const passwordHash = await bcrypt.hash(password, 10);

  async function resetUser(email: string) {
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { stories: { include: { audio: true, photos: true } } },
    });
    if (!existing) return;
    if (!reset) {
      console.log(`${email} already exists. Run npm run seed:reset to replace the sample family.`);
      return existing;
    }
    await prisma.user.delete({ where: { id: existing.id } });
    return null;
  }

  const meiExisting = await resetUser("mei@hearthlight.local");
  const linExisting = await resetUser("lin@hearthlight.local");
  if (meiExisting && linExisting && !reset) {
    await prisma.$disconnect();
    return;
  }

  async function photo(userId: string, storyId: string, file: string, caption: string, sortOrder: number) {
    const bytes = fs.readFileSync(path.join(process.cwd(), "seed", "photos", file));
    const storageKey = `users/${userId}/stories/${storyId}/${file}`;
    await storagePut(storageKey, bytes, "image/png");
    await prisma.photo.create({
      data: { storyId, storageKey, mimeType: "image/png", bytes: bytes.length, caption, sortOrder },
    });
  }

  if (!meiExisting || reset) {
    const mei = await prisma.user.create({
      data: {
        email: "mei@hearthlight.local",
        name: "陳美玲",
        passwordHash,
        locale: "zh-Hant",
        frequency: "weekly",
        customIntervalDays: 14,
        onboarded: true,
        familyRole: "grandparent",
        childhoodPlace: "廣州西關",
        placesLived: "香港",
        occupation: "車縫",
        importantPeople: "阿樂、詠、Eli",
        hobbies: "粵劇、煲湯",
        openTopics: JSON.stringify(["childhood", "elders", "food", "places", "traditions", "children"]),
        skipTopics: JSON.stringify(["war", "money"]),
        nextPromptAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    const stories = [
      {
        questionId: "ch-morning-street",
        questionText: "小時候，你家門外的街上，早上都是什麼聲音？",
        title: "西關的早晨",
        format: { font: "serif", size: "large", align: "left", lineHeight: "relaxed", indent: true, dropCap: false },
        photos: [{ file: "tea.png", caption: "後來在香港，早晨還是先喝茶。" }],
        paragraphs: [
          "我小時候住在廣州西關。天還沒有全亮，巷子裡就有人拉車，木輪子壓過石板，聲音一下一下的。對門的阿姨會把窗推開，問我媽今天買不買菜。",
          "我家的樓梯是木的，踩上去會響。我下樓時總是抓著扶手，扶手給人摸得又光又滑。門口有一棵樹，我現在說不出名字，只記得夏天的影子鋪了整條巷。",
          "媽媽叫我的聲音不高，可是我聽得見。她要是叫第二聲，我就知道不能再玩了。",
        ],
      },
      {
        questionId: "sk-hands",
        questionText: "你的雙手會做哪件事，是你心裡輕輕覺得驕傲的？",
        title: "針線",
        format: { font: "serif", size: "large", align: "justify", lineHeight: "relaxed", indent: true, dropCap: false },
        photos: [{ file: "sewing.png", caption: "線軸原本放在一個餅盒裡。" }],
        paragraphs: [
          "媽媽教我車縫的時候，我還坐不穩一張高凳。她把針在頭髮上抹一抹，說這樣才滑。我問為什麼，她說你以後就知道。",
          "線軸放在一個鐵盒子裡，紅的、藍的、白的。盒子本來是裝餅的，蓋子不嚴，我一拉，線就滾到床底下。媽媽不罵我，只說：撿回來，線也是錢。",
          "我後來在香港也做過車縫。手會了，心裡卻常常回到那張高凳。我想讓詠知道，她婆婆的手不是一開始就穩的。",
        ],
      },
      {
        questionId: "mg-hardest",
        questionText: "在一個新地方開始生活，最難的是什麼？",
        title: "到了香港",
        format: { font: "sans", size: "large", align: "left", lineHeight: "loose", indent: true, dropCap: false },
        photos: [{ file: "market.png", caption: "菜我很快就認得，街名卻記了很久。" }],
        paragraphs: [
          "第一次來香港，我記得水的氣味不一樣。人很多，我抓著阿樂的袖口，怕一放手就找不到。",
          "我們住的地方很小，窗外面是別人家的窗。我把廣州帶來的一把剪刀放在最上面的抽屜，好像東西在，人就還在。",
          "街道的名字我很久才記住。街市我卻很快熟了，因為菜的名字，有些和家裡一樣，有些要重新學。學了，也就算在這裡生活了。",
        ],
      },
      {
        questionId: "fd-guests",
        questionText: "平日吃米飯、粥，還是麵條？來了客人又吃什麼？",
        title: "星期日的粥",
        format: { font: "serif", size: "xlarge", align: "left", lineHeight: "relaxed", indent: true, dropCap: false },
        photos: [{ file: "congee.png", caption: "花生、腐竹，有時有白飯魚。" }],
        paragraphs: [
          "星期日我們喝粥。不是因為講究，是因為一鍋粥可以慢慢添，誰晚起都有得吃。",
          "我放花生、腐竹，有時有白飯魚。阿樂喜歡鹹的，詠小時候把糖碟拉到自己那邊。我裝看不見。",
          "現在人少了，我還是會煮。煮的時候屋子裡有聲，我就覺得這一天是齊的。",
        ],
      },
    ];
    for (const [index, item] of stories.entries()) {
      const created = await prisma.story.create({
        data: {
          userId: mei.id,
          questionId: item.questionId,
          questionText: item.questionText,
          title: item.title,
          bodyHtml: html(item.paragraphs),
          formatJson: JSON.stringify(item.format),
          createdAt: new Date(Date.now() - (stories.length - index) * 86400000 * 12),
        },
      });
      for (const [photoIndex, itemPhoto] of item.photos.entries()) {
        await photo(mei.id, created.id, itemPhoto.file, itemPhoto.caption, photoIndex);
      }
    }
    console.log("Seeded 陳美玲 / mei@hearthlight.local");
  }

  if (!linExisting || reset) {
    const lin = await prisma.user.create({
      data: {
        email: "lin@hearthlight.local",
        name: "林伟",
        passwordHash,
        locale: "zh-Hans",
        frequency: "monthly",
        customIntervalDays: 14,
        onboarded: true,
        familyRole: "parent",
        childhoodPlace: "汕头",
        placesLived: "深圳",
        occupation: "机修",
        importantPeople: "林晓",
        hobbies: "骑车、听收音机",
        openTopics: JSON.stringify(["work", "children", "places", "childhood"]),
        skipTopics: JSON.stringify(["war"]),
        nextPromptAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      },
    });
    const first = await prisma.story.create({
      data: {
        userId: lin.id,
        questionId: "wk-first-day",
        questionText: "说说你第一天上班的情形。",
        title: "第一天进厂",
        bodyHtml: html([
          "我十八岁进厂，师傅把一把扳手放到我手里，说先别问工资，问这颗螺丝为什么松。我当时只想着月底能不能给家里寄钱。",
          "车间很吵，我学会看别人的嘴形。中午的饭是大锅菜，我吃得很快，因为吃完可以在墙边坐一会儿。",
          "那把扳手我用了很多年。换工作的时候我没带走，可是手还记得它的重量。",
        ]),
        formatJson: JSON.stringify({ font: "sans", size: "large", align: "left", lineHeight: "relaxed", indent: true, dropCap: false }),
        createdAt: new Date(Date.now() - 40 * 86400000),
      },
    });
    await photo(lin.id, first.id, "wrench.png", "师傅的工具箱就靠在这面墙边。", 0);
    const second = await prisma.story.create({
      data: {
        userId: lin.id,
        questionId: "cd-afternoon",
        questionText: "和孩子度过的哪一个平常下午，你愿意再过一次？",
        title: "教晓骑车",
        bodyHtml: html([
          "晓第一次骑车，在宿舍后面的空地。我扶着后座，她喊爸爸你别松手，我说明明还扶着。",
          "其实我松过一次。她骑出去两三米，车子歪了，人没倒，回头看我，又气又笑。",
          "那天的风是热的。我现在还想得起她头发贴在脸上的样子。如果她以后问我，平淡的日子里有什么高兴的事，我想先讲这一件。",
        ]),
        formatJson: JSON.stringify({ font: "serif", size: "large", align: "left", lineHeight: "relaxed", indent: true, dropCap: false }),
        createdAt: new Date(Date.now() - 12 * 86400000),
      },
    });
    await photo(lin.id, second.id, "bicycle.png", "空地不大，够她骑出去又骑回来。", 0);
    console.log("Seeded 林伟 / lin@hearthlight.local");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
