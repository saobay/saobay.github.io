# -*- coding: utf-8 -*-
"""Sinh file Bai_tap Unit 12: Life on other planets (Anh 8, Global Success)."""
import json, io

def mcq(q, opts, ans, level, explain):
    return {"type": "mcq", "q": q, "options": opts, "answer": ans, "level": level, "explain": explain}

def tf(q, stmts, ans, level, explain):
    return {"type": "truefalse", "q": q, "statements": stmts, "answer": ans, "level": level, "explain": explain}

def short(q, ans, level, explain):
    return {"type": "short", "q": q, "answer": ans, "level": level, "explain": explain}

def R(passage, stmts, ans, level, explain):
    return tf(passage + "\n\nRead the passage and decide whether the following statements are True (T) or False (F).",
              stmts, ans, level, explain)

sets = []

# ---------------- DE 1 (pattern A: NB,TH,TH,NB,TH,NB,VD,VD,VDC,VDC) ----------------
sets.append({"name": "Đề 1", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. hear","B. near","C. bear","D. dear"], "C", "NB",
    "bear phát âm /beər/ với âm /eə/, còn hear, near, dear phát âm /ɪə/."),
mcq("Choose the word whose underlined 'are' is pronounced differently from the others.",
    ["A. care","B. share","C. square","D. are"], "D", "TH",
    "are phát âm /ɑː/, còn care, share, square phát âm /eə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. planet","B. about","C. orbit","D. surface"], "B", "TH",
    "about trọng âm rơi vào âm tiết thứ 2 (a-BOUT), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("An ___ is a person who travels in space.",
    ["A. astronaut","B. teacher","C. farmer","D. driver"], "A", "NB",
    "astronaut = phi hành gia, người du hành vũ trụ."),
mcq("The ___ is the layer of air around the Earth.",
    ["A. ground","B. atmosphere","C. ocean","D. land"], "B", "TH",
    "atmosphere = bầu khí quyển, lớp không khí bao quanh Trái Đất."),
mcq("He asked me ___ I liked science fiction films.",
    ["A. that","B. if","C. what","D. when"], "B", "NB",
    "Tường thuật câu hỏi Yes/No dùng 'if' (hoặc whether)."),
mcq("A: 'Do you believe in aliens?' - B: '___'",
    ["A. Yes, I do.","B. No, I am.","C. Yes, I believe.","D. I do not."], "A", "VD",
    "Trả lời câu hỏi Yes/No với trợ động từ do: 'Yes, I do'."),
R("People have told stories about aliens for many years. Some say they saw strange lights in the sky. Others say they met small green creatures. Scientists have not found any real aliens yet.",
  ["a) People tell stories about aliens.","b) Some people saw strange lights.","c) Scientists have found real aliens.","d) Some people met green creatures."],
  ["T","T","F","T"], "VD",
  "a) T; b) T; c) F (have not found any real aliens); d) T."),
R("Scientists are looking for planets like Earth around other stars. These planets are called exoplanets. Some exoplanets may have water and air. Finding life on an exoplanet would be the greatest discovery in history.",
  ["a) Exoplanets go around other stars.","b) All exoplanets have water.","c) Some exoplanets may have air.","d) Finding life there would be a great discovery."],
  ["T","F","T","T"], "VDC",
  "a) T; b) F (some, không phải all); c) T; d) T (greatest discovery)."),
short("Fill in the blank with ONE word: An ___ is a person who travels in space.",
    "astronaut", "VDC",
    "astronaut = phi hành gia."),
]})

# ---------------- DE 2 ----------------
sets.append({"name": "Đề 2", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. earth","B. hear","C. near","D. fear"], "A", "NB",
    "earth phát âm /ɜːθ/ với âm /ɜː/, còn hear, near, fear phát âm /ɪə/."),
mcq("Choose the word whose underlined 'are' is pronounced differently from the others.",
    ["A. care","B. dare","C. water","D. share"], "C", "TH",
    "water phát âm /ˈwɔːtər/ với âm /ɔː/, còn care, dare, share phát âm /eə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. exist","B. planet","C. orbit","D. surface"], "A", "TH",
    "exist trọng âm rơi vào âm tiết thứ 2 (ex-IST), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("The ___ is the path a planet follows around the Sun.",
    ["A. orbit","B. road","C. river","D. street"], "A", "NB",
    "orbit = quỹ đạo, đường đi của hành tinh quanh Mặt Trời."),
mcq("Astronauts wear ___ to stay safe in space.",
    ["A. uniforms","B. spacesuits","C. jackets","D. shoes"], "B", "TH",
    "spacesuit = bộ đồ vũ trụ, giúp phi hành gia an toàn ngoài không gian."),
mcq("She asked me where ___ from.",
    ["A. I am","B. was I","C. I was","D. am I"], "C", "NB",
    "Tường thuật câu hỏi Wh-: không đảo ngữ, lùi thì 'am' → 'was': where I was."),
mcq("A: 'What would you do if you met an alien?' - B: '___'",
    ["A. I would say hello.","B. I am fine.","C. Thank you.","D. Goodbye."], "A", "VD",
    "Trả lời câu hỏi giả định 'what would you do': I would say hello."),
R("Mars is called the Red Planet because its ground looks red. It is smaller than Earth. Scientists have sent robots to Mars to take pictures and study its rocks. One day, humans may visit Mars.",
  ["a) Mars is called the Red Planet.","b) Mars is bigger than Earth.","c) Robots have been sent to Mars.","d) Humans may visit Mars one day."],
  ["T","F","T","T"], "VD",
  "a) T; b) F (smaller than Earth); c) T; d) T."),
R("The solar system has eight planets. Mercury is the closest to the Sun, and Neptune is the farthest. Earth is the only planet with life that we know. Jupiter is the largest planet.",
  ["a) There are eight planets in the solar system.","b) Mercury is the farthest from the Sun.","c) Jupiter is the largest planet.","d) We know life on other planets."],
  ["T","F","T","F"], "VDC",
  "a) T; b) F (Neptune is the farthest); c) T; d) F (only Earth)."),
short("Give the correct form of the verb in brackets: She asked me where I ___ (live).",
    "lived", "VDC",
    "'live' (hiện tại đơn) lùi thành 'lived' (quá khứ đơn) trong câu hỏi tường thuật."),
]})

# ---------------- DE 3 ----------------
sets.append({"name": "Đề 3", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. near","B. dear","C. learn","D. fear"], "C", "NB",
    "learn phát âm /lɜːn/ với âm /ɜː/, còn near, dear, fear phát âm /ɪə/."),
mcq("Choose the word whose underlined 'ere' is pronounced differently from the others.",
    ["A. here","B. there","C. where","D. everywhere"], "A", "TH",
    "here phát âm /hɪər/ với âm /ɪə/, còn there, where, everywhere phát âm /eə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. galaxy","B. creature","C. begin","D. planet"], "C", "TH",
    "begin trọng âm rơi vào âm tiết thứ 2 (be-GIN), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("Mars is called the Red ___.",
    ["A. star","B. planet","C. moon","D. sun"], "B", "NB",
    "Mars = sao Hỏa, một hành tinh (planet) có màu đỏ."),
mcq("___ keeps us on the ground and stops us from floating away.",
    ["A. Gravity","B. Wind","C. Rain","D. Air"], "A", "TH",
    "gravity = trọng lực, giữ chúng ta trên mặt đất."),
mcq("She asked him ___ he could swim.",
    ["A. that","B. if","C. what","D. where"], "B", "NB",
    "Tường thuật câu hỏi Yes/No dùng 'if'; 'could' là dạng lùi thì của 'can'."),
mcq("A: 'Have you ever seen a UFO?' - B: '___'",
    ["A. No, never.","B. I don't know.","C. Thank you.","D. Goodbye."], "A", "VD",
    "Trả lời câu hỏi Have you ever...: 'No, never' (chưa bao giờ)."),
R("The Moon is the closest object to Earth in space. It takes about three days to travel there by spacecraft. There is no air or water on the Moon, so people must wear spacesuits to walk on its surface.",
  ["a) The Moon is far from Earth.","b) It takes about three days to get there.","c) There is air on the Moon.","d) People need spacesuits on the Moon."],
  ["F","T","F","T"], "VD",
  "a) F (closest object); b) T; c) F (no air); d) T."),
R("UFO means Unidentified Flying Object. Many people say they saw UFOs in the sky. Most of these objects were later found to be planes or balloons. Scientists are still studying some strange cases.",
  ["a) UFO means Unidentified Flying Object.","b) All UFOs are alien spaceships.","c) Some UFOs were planes or balloons.","d) Scientists still study strange cases."],
  ["T","F","T","T"], "VDC",
  "a) T; b) F (most were planes or balloons); c) T; d) T."),
short("Give the correct form of the verb in brackets: He asked if I ___ (see) the strange light.",
    "had seen", "VDC",
    "'saw' (quá khứ đơn) lùi thành 'had seen' (quá khứ hoàn thành)."),
]})

# ---------------- DE 4 ----------------
sets.append({"name": "Đề 4", "questions": [
mcq("Choose the word whose underlined 'are' is pronounced differently from the others.",
    ["A. care","B. share","C. large","D. square"], "C", "NB",
    "large phát âm /lɑːdʒ/ với âm /ɑː/, còn care, share, square phát âm /eə/."),
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. bear","B. pear","C. wear","D. hear"], "D", "TH",
    "hear phát âm /hɪər/ với âm /ɪə/, còn bear, pear, wear phát âm /eə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. solar","B. begin","C. planet","D. orbit"], "B", "TH",
    "begin trọng âm rơi vào âm tiết thứ 2 (be-GIN), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("Humans need ___ to breathe.",
    ["A. water","B. oxygen","C. food","D. light"], "B", "NB",
    "oxygen = khí ô-xy, con người cần để thở."),
mcq("A UFO is an ___ flying object that people cannot explain.",
    ["A. identified","B. unidentified","C. important","D. interesting"], "B", "TH",
    "UFO = Unidentified Flying Object (vật thể bay không xác định)."),
mcq("'Where do you live?' he asked. → He asked me where ___.",
    ["A. do I live","B. I lived","C. I live","D. did I live"], "B", "NB",
    "Tường thuật câu hỏi Wh-: không đảo ngữ, bỏ 'do', lùi thì: where I lived."),
mcq("A: 'Which planet do you like most?' - B: '___'",
    ["A. I like Mars most.","B. I like it.","C. It's big.","D. Thank you."], "A", "VD",
    "Trả lời đúng câu hỏi 'which planet': nêu tên hành tinh mình thích nhất."),
R("An astronaut is a person who travels in space. Astronauts wear special clothes called spacesuits. They eat special food and sleep in small beds on the spacecraft.",
  ["a) An astronaut travels in space.","b) Astronauts wear spacesuits.","c) They eat normal food like us.","d) They sleep on the spacecraft."],
  ["T","T","F","T"], "VD",
  "a) T; b) T; c) F (special food); d) T."),
R("A telescope helps us see far objects in space. With a telescope, we can see the mountains on the Moon and the rings of Saturn. The first telescope was made more than 400 years ago.",
  ["a) A telescope helps us see far objects.","b) We can see the Moon's mountains with it.","c) We can see Saturn's rings.","d) The first telescope was made 40 years ago."],
  ["T","T","T","F"], "VDC",
  "a) T; b) T; c) T; d) F (more than 400 years ago)."),
short("Fill in the blank with ONE word: Mars is called the ___ Planet.",
    "Red", "VDC",
    "Red Planet = Hành tinh Đỏ (sao Hỏa)."),
]})

# ---------------- DE 5 ----------------
sets.append({"name": "Đề 5", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. appear","B. clear","C. wear","D. idea"], "C", "NB",
    "wear phát âm /weər/ với âm /eə/, còn appear, clear, idea phát âm /ɪə/."),
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. year","B. nearly","C. dear","D. wear"], "D", "TH",
    "wear phát âm /weər/ với âm /eə/, còn year, nearly, dear phát âm /ɪə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. about","B. planet","C. alien","D. surface"], "A", "TH",
    "about trọng âm rơi vào âm tiết thứ 2 (a-BOUT), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("The ___ has eight planets going around it.",
    ["A. Moon","B. solar system","C. galaxy","D. star"], "B", "NB",
    "solar system = hệ Mặt Trời, gồm 8 hành tinh quay quanh Mặt Trời."),
mcq("Scientists use a ___ to look at far stars.",
    ["A. camera","B. telescope","C. phone","D. mirror"], "B", "TH",
    "telescope = kính viễn vọng, dùng để quan sát các vì sao ở xa."),
mcq("Jupiter is ___ planet in our solar system.",
    ["A. the largest","B. largest","C. larger","D. large"], "A", "NB",
    "So sánh nhất luôn có 'the': the largest (lớn nhất)."),
mcq("A: 'I think humans will live on Mars one day.' - B: '___'",
    ["A. I hope so.","B. Good luck.","C. Never mind.","D. See you."], "A", "VD",
    "Bày tỏ hy vọng đồng tình: 'I hope so' (tôi cũng hy vọng vậy)."),
R("In 1969, two American astronauts walked on the Moon for the first time. Millions of people watched it on TV. Their footprints are still there because there is no wind on the Moon.",
  ["a) Astronauts first walked on the Moon in 1969.","b) Millions of people watched on TV.","c) Their footprints are still on the Moon.","d) There is strong wind on the Moon."],
  ["T","T","T","F"], "VD",
  "a) T; b) T; c) T; d) F (no wind on the Moon)."),
R("Digital maps on phones use satellites in space. The satellites send signals to show our position on Earth. Without satellites, GPS on our phones would not work.",
  ["a) Digital maps use satellites.","b) Satellites show our position.","c) GPS works without satellites.","d) Satellites send signals to Earth."],
  ["T","T","F","T"], "VDC",
  "a) T; b) T; c) F (would not work); d) T."),
short("Give the correct form of the adjective in brackets: Jupiter is ___ (large) planet in the solar system.",
    "the largest", "VDC",
    "So sánh nhất: the + large-est = the largest."),
]})

# ---------------- DE 6 (pattern B: TH,VD,VDC,NB,TH,VD,NB,NB,TH,VDC) ----------------
sets.append({"name": "Đề 6", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. appear","B. disappear","C. fear","D. bear"], "D", "TH",
    "bear phát âm /beər/ với âm /eə/, còn appear, disappear, fear phát âm /ɪə/."),
mcq("Choose the word whose underlined 'eer' is pronounced differently from the others.",
    ["A. deer","B. peer","C. steer","D. heart"], "D", "VD",
    "heart phát âm /hɑːt/ với âm /ɑː/, còn deer, peer, steer phát âm /ɪə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. oxygen","B. planet","C. appear","D. orbit"], "C", "VDC",
    "appear trọng âm rơi vào âm tiết thứ 2 (ap-PEAR), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("The Sun is the biggest ___ in our solar system.",
    ["A. planet","B. star","C. moon","D. rock"], "B", "NB",
    "The Sun = Mặt Trời, là một ngôi sao (star)."),
mcq("The rocket will ___ into space tomorrow morning.",
    ["A. land","B. launch","C. fall","D. swim"], "B", "TH",
    "launch = phóng (tên lửa, tàu vũ trụ) vào không gian."),
mcq("The teacher asked the students ___ they had seen a UFO.",
    ["A. that","B. whether","C. what","D. why"], "B", "VD",
    "Tường thuật câu hỏi Yes/No dùng 'if/whether'; ở đây đáp án là whether."),
mcq("A: 'Is there life on other planets?' - B: '___'",
    ["A. Maybe, we don't know yet.","B. Yes, it is.","C. No, I am.","D. Thank you."], "A", "NB",
    "Trả lời câu hỏi về sự sống ngoài hành tinh một cách hợp lý nhất."),
R("The Sun is a star in the middle of our solar system. It is very hot and very big. The Sun gives us light and heat. Without the Sun, there would be no life on Earth.",
  ["a) The Sun is a star.","b) The Sun is cold.","c) The Sun gives us light and heat.","d) Life needs the Sun."],
  ["T","F","T","T"], "NB",
  "a) T; b) F (very hot); c) T; d) T (no life without the Sun)."),
R("People have dreamed of living on Mars. The air there is too thin to breathe, and it is very cold at night. Scientists are building special houses for humans on Mars.",
  ["a) People dream of living on Mars.","b) The air on Mars is good to breathe.","c) Mars is very cold at night.","d) Scientists are building houses for Mars."],
  ["T","F","T","T"], "TH",
  "a) T; b) F (too thin to breathe); c) T; d) T."),
short("Give the correct form of the verb in brackets: He asked me whether I ___ (can) speak English.",
    "could", "VDC",
    "'can' lùi thành 'could' trong câu hỏi tường thuật."),
]})

# ---------------- DE 7 ----------------
sets.append({"name": "Đề 7", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. earth","B. early","C. heard","D. near"], "D", "TH",
    "near phát âm /nɪər/ với âm /ɪə/, còn earth, early, heard phát âm /ɜː/."),
mcq("Choose the word whose underlined 'ere' is pronounced differently from the others.",
    ["A. severe","B. there","C. sincere","D. mere"], "B", "VD",
    "there phát âm /ðeər/ với âm /eə/, còn severe, sincere, mere phát âm /ɪə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. atmosphere","B. doctor","C. planet","D. orbit"], "A", "VDC",
    "atmosphere trọng âm rơi vào âm tiết thứ 2 (at-MOS-phere), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("The spacecraft will ___ on the Moon next week.",
    ["A. fly","B. land","C. swim","D. run"], "B", "NB",
    "land = hạ cánh; tàu vũ trụ sẽ hạ cánh xuống Mặt Trăng."),
mcq("Do you think life can ___ on Mars?",
    ["A. exist","B. die","C. sleep","D. eat"], "A", "TH",
    "exist = tồn tại; liệu sự sống có thể tồn tại trên sao Hỏa không."),
mcq("He asked, 'Did you see the alien?' → He asked if I ___ the alien.",
    ["A. saw","B. had seen","C. see","D. have seen"], "B", "VD",
    "'did see' (quá khứ đơn) lùi thành 'had seen' (quá khứ hoàn thành)."),
mcq("A: 'Would you like to travel to space?' - B: '___'",
    ["A. Yes, I'd love to.","B. I don't know.","C. Thank you.","D. See you."], "A", "NB",
    "Nhận lời mời một cách hào hứng: 'Yes, I'd love to'."),
R("Satellites fly around the Earth. They help us watch the weather and use GPS on our phones. Scientists send satellites into space with rockets.",
  ["a) Satellites fly around the Earth.","b) They help us watch the weather.","c) GPS works without satellites.","d) Scientists use rockets to send satellites."],
  ["T","T","F","T"], "NB",
  "a) T; b) T; c) F (GPS cần vệ tinh); d) T."),
R("Venus is the hottest planet in our solar system. Its thick clouds keep the heat inside. A day on Venus is longer than a year on Venus.",
  ["a) Venus is the hottest planet.","b) Venus has thick clouds.","c) A day on Venus is short.","d) Venus is colder than Earth."],
  ["T","T","F","F"], "TH",
  "a) T; b) T; c) F (longer than a year); d) F (hottest planet)."),
short("Give the correct form of the verb in brackets: She asked what time it ___ (be).",
    "was", "VDC",
    "'is' lùi thành 'was'; câu hỏi tường thuật không đảo ngữ: what time it was."),
]})

# ---------------- DE 8 ----------------
sets.append({"name": "Đề 8", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. clear","B. idea","C. really","D. wear"], "D", "TH",
    "wear phát âm /weər/ với âm /eə/, còn clear, idea, really phát âm /ɪə/."),
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. appear","B. disappear","C. dear","D. wear"], "D", "VD",
    "wear phát âm /weər/ với âm /eə/, còn appear, disappear, dear phát âm /ɪə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. discover","B. planet","C. orbit","D. surface"], "A", "VDC",
    "discover trọng âm rơi vào âm tiết thứ 2 (dis-CO-ver), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("A ___ is a very big group of stars.",
    ["A. planet","B. galaxy","C. moon","D. sun"], "B", "NB",
    "galaxy = thiên hà, tập hợp rất lớn các ngôi sao."),
mcq("There is no ___ that aliens really exist.",
    ["A. evidence","B. picture","C. story","D. film"], "A", "TH",
    "evidence = bằng chứng; chưa có bằng chứng người ngoài hành tinh tồn tại."),
mcq("'What time is it?' she asked. → She asked what time ___.",
    ["A. is it","B. it is","C. was it","D. it was"], "D", "VD",
    "Câu hỏi tường thuật: không đảo ngữ, lùi thì 'is' → 'was': what time it was."),
mcq("A: 'Look! A strange light in the sky!' - B: '___'",
    ["A. Wow, amazing!","B. Good morning.","C. Thank you.","D. I'm sorry."], "A", "NB",
    "Bày tỏ ngạc nhiên trước ánh sáng lạ: 'Wow, amazing!'"),
R("The first person in space was Yuri Gagarin from Russia. In 1961, he flew around the Earth in 108 minutes. His flight opened the age of space travel for humans.",
  ["a) Yuri Gagarin was the first person in space.","b) He came from Russia.","c) His flight took 108 minutes.","d) His flight closed the age of space travel."],
  ["T","T","T","F"], "NB",
  "a) T; b) T; c) T; d) F (opened, không phải closed)."),
R("Black holes are places in space with very strong gravity. Nothing can escape from them, not even light. Scientists study black holes with special telescopes.",
  ["a) Black holes have weak gravity.","b) Light cannot escape from black holes.","c) Scientists use telescopes to study them.","d) Black holes are in space."],
  ["F","T","T","T"], "TH",
  "a) F (very strong gravity); b) T; c) T; d) T."),
short("Give the correct form of the word in brackets: There is no ___ (evident) that aliens exist.",
    "evidence", "VDC",
    "Sau 'no' cần danh từ: evidence (bằng chứng)."),
]})

# ---------------- DE 9 ----------------
sets.append({"name": "Đề 9", "questions": [
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. theater","B. bear","C. wear","D. pear"], "A", "TH",
    "theater phát âm /ˈθɪətər/ với âm /ɪə/, còn bear, wear, pear phát âm /eə/."),
mcq("Choose the word whose underlined 'are' is pronounced differently from the others.",
    ["A. rare","B. dare","C. warm","D. share"], "C", "VD",
    "warm phát âm /wɔːm/ với âm /ɔː/, còn rare, dare, share phát âm /eə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. creature","B. exist","C. planet","D. orbit"], "B", "VDC",
    "exist trọng âm rơi vào âm tiết thứ 2 (ex-IST), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("Some people believe ___ live on other planets.",
    ["A. aliens","B. teachers","C. farmers","D. babies"], "A", "NB",
    "alien = người ngoài hành tinh; một số người tin họ sống trên hành tinh khác."),
mcq("The ___ of the Moon has many holes called craters.",
    ["A. surface","B. sky","C. air","D. water"], "A", "TH",
    "surface = bề mặt; bề mặt Mặt Trăng có nhiều hố gọi là miệng núi lửa."),
mcq("Mount Everest is one of ___ mountains in the world.",
    ["A. the highest","B. highest","C. higher","D. high"], "A", "VD",
    "Cấu trúc: one of the + so sánh nhất + danh từ số nhiều."),
mcq("A: 'The film about aliens was amazing!' - B: '___'",
    ["A. I think so too.","B. You're welcome.","C. Good luck.","D. Never mind."], "A", "NB",
    "Đồng tình với nhận xét về bộ phim: 'I think so too'."),
R("Astronauts on the International Space Station do many experiments. They study plants, the human body, and new materials. Their work helps scientists on Earth.",
  ["a) Astronauts do experiments in space.","b) They study plants.","c) They study the human body.","d) Their work is useless for Earth."],
  ["T","T","T","F"], "NB",
  "a) T; b) T; c) T; d) F (helps scientists on Earth)."),
R("The Milky Way is the galaxy we live in. It has billions of stars. Our solar system is in one small part of the Milky Way. Light takes 100,000 years to travel across it.",
  ["a) We live in the Milky Way.","b) It has billions of stars.","c) Our solar system is very big in the galaxy.","d) Light needs 100,000 years to cross it."],
  ["T","T","F","T"], "TH",
  "a) T; b) T; c) F (one small part); d) T."),
short("Fill in the blank with ONE word: We need ___ to breathe.",
    "oxygen", "VDC",
    "oxygen = khí ô-xy, thứ con người cần để thở."),
]})

# ---------------- DE 10 ----------------
sets.append({"name": "Đề 10", "questions": [
mcq("Choose the word whose underlined 'are' is pronounced differently from the others.",
    ["A. square","B. care","C. are","D. share"], "C", "TH",
    "are phát âm /ɑː/, còn square, care, share phát âm /eə/."),
mcq("Choose the word whose underlined 'ear' is pronounced differently from the others.",
    ["A. appear","B. wear","C. clear","D. disappear"], "B", "VD",
    "wear phát âm /weər/ với âm /eə/, còn appear, clear, disappear phát âm /ɪə/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. planet","B. surface","C. exist","D. orbit"], "C", "VDC",
    "exist trọng âm rơi vào âm tiết thứ 2 (ex-IST), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("An ___ is a living thing, real or imaginary.",
    ["A. creature","B. machine","C. robot","D. plant"], "A", "NB",
    "creature = sinh vật (có thật hoặc tưởng tượng)."),
mcq("Scientists are ___ the possibility of life on other planets.",
    ["A. exploring","B. ignoring","C. forgetting","D. leaving"], "A", "TH",
    "explore = khám phá, tìm hiểu; các nhà khoa học đang tìm hiểu khả năng có sự sống."),
mcq("Of the eight planets, Neptune is ___ from the Sun.",
    ["A. the farthest","B. farthest","C. farther","D. far"], "A", "VD",
    "So sánh nhất luôn có 'the': the farthest (xa nhất)."),
mcq("A: 'How do astronauts eat in space?' - B: '___'",
    ["A. They eat special food from bags.","B. They are hungry.","C. I don't know.","D. Thanks."], "A", "NB",
    "Trả lời đúng câu hỏi 'how': ăn thức ăn đặc biệt đựng trong túi."),
R("Jupiter is the largest planet in our solar system. It has a big red spot, which is a huge storm. Jupiter has more than 90 moons going around it.",
  ["a) Jupiter is the largest planet.","b) The red spot is a storm.","c) Jupiter has no moons.","d) Jupiter is in our solar system."],
  ["T","T","F","T"], "NB",
  "a) T; b) T; c) F (more than 90 moons); d) T."),
R("Space travel is becoming cheaper. Some companies now sell tickets for short trips to space. In the future, normal people may travel to space like they travel by plane today.",
  ["a) Space travel is becoming cheaper.","b) Companies sell tickets to space.","c) Only astronauts will ever go to space.","d) Normal people may travel to space one day."],
  ["T","T","F","T"], "TH",
  "a) T; b) T; c) F (normal people may travel); d) T."),
short("Fill in the blank with ONE word: UFO means Unidentified Flying ___.",
    "Object", "VDC",
    "UFO = Unidentified Flying Object (vật thể bay không xác định)."),
]})

# ---------------- XUAT FILE ----------------
assert len(sets) == 10, len(sets)
for s in sets:
    assert len(s["questions"]) == 10, s["name"]
    for q in s["questions"]:
        assert q.get("level") in ("NB","TH","VD","VDC"), q
        assert q.get("explain"), q
        for v in json.dumps(q, ensure_ascii=False):
            assert v not in "<>&", "ky tu cam: %r" % v

data = {"sets": sets}
counts = {"NB":0,"TH":0,"VD":0,"VDC":0}
for s in sets:
    for q in s["questions"]:
        counts[q["level"]] += 1
print("Phan bo U12:", counts)

tpl = io.open("/home/hatch/workspace/anh8/TEMPLATE_baitap.html", encoding="utf-8").read()
out = tpl.replace("@@TITLE@@", "Unit 12: Life on other planets")
out = out.replace("@@SUBTITLE@@", "Unit 12: Life on other planets • Tiếng Anh 8 (Global Success)")
out = out.replace("@@JSON@@", json.dumps(data, ensure_ascii=False, indent=1))
io.open("/home/hatch/workspace/anh8/staging/ANH_8_Unit_12_Life_on_other_planets_Bai_tap_none.html",
        "w", encoding="utf-8").write(out)
print("OK U12")
