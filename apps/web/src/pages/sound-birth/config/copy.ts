import {SOUND_SOURCE_MAX_MS} from '@wanwu-v2/contracts/sound';
import type {SoundDimension,SoundSourceKind} from '@wanwu-v2/contracts/sound';
import type {RecorderFailure} from '../../../shared/audio/LocalRecorder';
import type {CreationEntry} from '../../../app/navigation';

export const birthCopy={
 title:'给声音，做出你听见的样子',
 subtitle:'选声音、改声卡、对比试听，都在这里完成。',
 // Current-sound bar
 currentSound:'当前声音',noSound:'还没有选声音',listen:'试听',
 record:'录音',upload:'上传声音',library:'从声音库挑选',paperCard:'拍照读声卡',paperCardChip:'纸卡照片',
 // 我的声卡
 myCard:'我的声卡',
 confirmCard:'确认声卡信息',editCard:'修改信息',credit:(by:string)=>`提供：${by}`,license:'来源与许可',
 maker:'做声音的人',makerHint:'写名字',makerEdit:'编辑做声音的人',
 shapeTitle:'声音的样子',
 // One question per row, shown on the row being looked at.
 rowHints:{pitch:'声音是站得高，还是站得低？',duration:'声音能响多久？',contour:'声音是怎么走的？',intensity:'声音是轻轻的，还是大大的？',pattern:'声音是怎么出现的？'} satisfies Record<SoundDimension,string>,
 progress:(done:number,total:number)=>`已选 ${done} / ${total}`,
 bubble:{empty:'先给我一个声音吧！',fresh:(name:string)=>`我是「${name}」，给我变个样子吧～`,shaped:(desc:string)=>`我现在${desc}`,sounding:'听，我在唱歌～',hello:'你好呀！'},
 greet:'声音标记，点一点和它打招呼',rename:'改名字',original:'听原声',current:'听现在的',stopPlaying:'停',
 keepOriginal:'原声保留，随时可以比较。',
 emptyCard:{card:'先拍下纸卡，再录音或从声音库挑选它对应的声音。',upload:'先录一段声音，或上传录好的声音。',library:'从声音库里挑一个声音。',direct:'先在上方录音、上传，或从声音库挑选。'} satisfies Record<CreationEntry|'direct',string>,
 sourceLabel:{example:'示例声音','local-recording':'本机录音 · 未上传','local-file':'本机文件 · 未上传'} satisfies Record<SoundSourceKind,string>,
 // Editor
 tapToClear:'再点一下取消',
 optionHint:'选一项听听变化，再点一下就取消；不选的保持原声。',
 backEntry:'返回入口',finish:'做好了，去万物声场',finishUnavailable:'暂未开放',
 needSound:'先在上方选一个声音。',
 needProvenance:'补齐下面的声音信息，这个声音才能溯源。',
 worldUnavailable:'万物声场还在准备中，暂未开放。你的声音、选择和来源信息都还在这里。',
 noSoundYet:'选好声音后，就能听到每一项的变化。',
 paperCardNote:'读卡还未开放，请对照纸卡照片逐项选择。',
 // 声音信息与可见范围
 info:{
  title:'声卡信息',
  label:'来源名称',labelHint:'例如：操场上的风',
  recordedBy:'记录人（昵称）',recordedByHint:'例如：小林',
  recordedOn:'日期',
  place:'大致地点',placeHint:'例如：学校后山',
  group:'分组',groupHint:'例如：秋天的后山',
  visibility:'可见范围',visibilityLocal:'仅这台设备 · 共享未开放',
  archived:(path:string)=>`记入「${path}」。`,
  privacy:'只写昵称和大致地点，不写真实姓名和具体位置。',
  sessionOnly:'仅本次打开期间保留',
 },
 // Record dialog
 recordDialog:{title:'录一段声音',description:`最长 ${SOUND_SOURCE_MAX_MS/1000} 秒，录好后先听一听再用。`,start:'开始录音',stop:'停止',retake:'重录',use:'用这段声音',starting:'正在打开麦克风…'},
 // Library dialog
 libraryDialog:{title:'从声音库挑选',description:'先试听，再选用。',pick:'选用',current:'当前',scopes:'班级和公共声音库还未开放。'},
 reading:'正在读取声音…',
 defaultRecordingName:'我的录音',
 errors:{
  insecure:'当前地址不能使用麦克风（需要 https），可以先上传录好的声音。',
  unsupported:'这个浏览器不支持录音，可以上传录好的声音。',
  denied:'没有拿到麦克风权限，可以在浏览器设置里允许后再试。',
  'no-device':'没有找到麦克风。',
  failed:'录音没有成功，再试一次吧。',
  'too-short':'录得太短了，再录一次吧。',
 } satisfies Record<RecorderFailure,string>,
 fileTooBig:'文件太大了，请选 20MB 以内的声音。',
 fileUnreadable:'这个文件读不出声音，换一个试试。',
 tooLong:'这个文件超过 10 分钟，太长了，请先剪短一些再上传。',
 trimDialog:{title:'这段声音有点长',description:`一个声音最多用 ${SOUND_SOURCE_MAX_MS/1000} 秒。拖动绿框选出想要的一段，也可以点波形跳过去。`,
  start:'开始位置',end:'结束位置',picked:(from:string,to:string,length:string)=>`用 ${from} 到 ${to}，共 ${length} 秒`,
  listen:'试听这段',stop:'停',use:'用这段声音',cancel:'不用了'},
 slowNetwork:'网络有点慢，声音没加载出来，再点一次试试。',
 noAudio:'这个浏览器不能播放试听。',
} as const;

/** Room for a 45-second uncompressed WAV (48 kHz, 24-bit stereo ≈ 13 MB). */
export const FILE_MAX_BYTES=20*1024*1024;
