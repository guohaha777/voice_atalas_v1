// 音乐小发现 wording: one line for children, and — behind the bulb — a short explanation for the teacher. Many village
// teachers are not music specialists, so each fact names one music idea in plain words, says how to point it out while
// listening, and offers a question to ask the class. Hand-written, not generated.
import type {Discovery} from '../model/discoveries';

export type DiscoveryText={line:string;idea:string;explain:string;ask:string};

export function discoveryText(item:Discovery):DiscoveryText{
 switch(item.kind){
  case 'opening':return {
   line:item.next?`「${item.first}」先出现，「${item.next}」随后跟上。`:`「${item.first}」先出现。`,
   idea:'开头（引子）',
   explain:'乐曲最先响起的声音，像故事的第一句话，决定了大家对这首曲子的第一印象。',
   ask:`如果换成别的声音先出现，感觉会有什么不一样？`,
  };
  case 'repeat':return {
   line:`「${item.name}」出现了 ${item.times} 次，像在重复一句歌词。`,
   idea:'重复',
   explain:'同一个声音或同一段旋律再次出现，能让人记住它。很多儿歌都靠重复让人一听就会唱。',
   ask:`听的时候数一数：「${item.name}」一共出现了几次？`,
  };
  case 'echo':return {
   line:`「${item.a}」→「${item.b}」→「${item.a}」，像一问一答。`,
   idea:'呼应（一问一答）',
   explain:'一个声音“问”，另一个声音“答”，然后再回到第一个。音乐里叫呼应，常见的 ABA 结构也是这样“出去又回来”。',
   ask:'可以请两组同学，一组学“问”，一组学“答”，跟着曲子拍一拍。',
  };
  case 'together':return {
   line:`「${item.a}」和「${item.b}」有一段一起响，像在合唱。`,
   idea:'合奏（几个声部）',
   explain:'两个以上的声音同时响起，就像合唱团里不同的人同时唱。音乐会变得更厚、更热闹。',
   ask:'一起响的时候，你还能分清是哪两个声音吗？',
  };
  case 'long-short':return {
   line:`「${item.long}」响了 ${item.longSeconds} 秒，「${item.short}」只有 ${item.shortSeconds} 秒，一长一短。`,
   idea:'长音和短音（时值）',
   explain:'声音持续的时间不一样长，音乐里叫“时值”。长音听起来舒展，短音听起来轻快，长短搭配就有了节奏。',
   ask:'用手比一比：长的声音拉一条长线，短的声音点一个点。',
  };
  case 'rest':return {
   line:`中间有 ${item.seconds} 秒安安静静，像音乐里的休止符。`,
   idea:'休止（安静也是音乐）',
   explain:'音乐里的停顿叫休止。安静的时候，大家会更期待下一个声音，安静也是音乐的一部分。',
   ask:'听到安静的时候，大家一起屏住呼吸，等下一个声音出现。',
  };
  case 'busier':return {
   line:item.half==='first'?'前半段声音更多，开头很热闹。':'后半段声音更多，越往后越热闹。',
   idea:'疏密（越来越热闹）',
   explain:'同样长的时间里，声音多就显得紧凑热闹，声音少就显得宽松安静。作曲家常用由少到多来让音乐越来越激动。',
   ask:'哪一段让你觉得最热闹？为什么？',
  };
  case 'ending':return {
   line:item.same?`「${item.name}」开头出现，最后又由它收尾，首尾呼应。`:`最后由「${item.name}」收尾。`,
   idea:item.same?'首尾呼应':'结尾（尾声）',
   explain:item.same?'开头和结尾用同一个声音，听起来像绕了一圈又回到家，很完整。':'最后一个声音就像故事的结局，它慢慢消失的时候，大家知道曲子结束了。',
   ask:'如果让你换一个声音来结尾，你会选哪一个？',
  };
  case 'single':return {
   line:`整首只有「${item.name}」一个声音，回声场多放几个试试？`,
   idea:'从一个声音开始',
   explain:'一个声音也能成曲，但多放几次、换几个位置，就能听出重复和节奏。',
   ask:'如果再放一次这个声音，你想放在前面还是后面？',
  };
 }
}
