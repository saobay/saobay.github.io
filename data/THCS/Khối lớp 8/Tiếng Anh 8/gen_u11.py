# -*- coding: utf-8 -*-
"""Sinh file Bai_tap Unit 11: Science and technology (Anh 8, Global Success)."""
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
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. send","B. bed","C. great","D. help"], "C", "NB",
    "Chữ 'ea' trong great phát âm là /eɪ/, còn send, bed, help phát âm /e/."),
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. apple","B. man","C. travel","D. wash"], "D", "TH",
    "wash phát âm /wɒʃ/ với âm /ɒ/, còn apple, man, travel phát âm /æ/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. invention","B. device","C. robot","D. scientist"], "A", "TH",
    "invention trọng âm rơi vào âm tiết thứ 2 (in-VEN-tion), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("A ___ studies science and does experiments in a laboratory.",
    ["A. machine","B. scientist","C. robot","D. student"], "B", "NB",
    "scientist = nhà khoa học, người nghiên cứu khoa học."),
mcq("Thomas Edison ___ the light bulb in 1879.",
    ["A. discovered","B. invented","C. explored","D. built"], "B", "TH",
    "invent = phát minh ra thứ chưa từng tồn tại (bóng đèn điện); discover = khám phá thứ đã có sẵn."),
mcq("He said that he ___ very tired.",
    ["A. is","B. was","C. will be","D. has been"], "B", "NB",
    "Câu tường thuật: 'am' (hiện tại đơn) lùi thành 'was' (quá khứ đơn)."),
mcq("Lan: 'I think robots will do all our homework in the future.' - Minh: '___'",
    ["A. I don't think so.","B. You're welcome.","C. Good luck.","D. Never mind."], "A", "VD",
    "Khi bày tỏ ý kiến trái ngược một cách lịch sự, dùng 'I don't think so'."),
R("Thomas Edison was a great American inventor. In 1879, he invented the light bulb. He also made the phonograph, an early machine that could play sound. During his life, Edison had more than 1,000 inventions.",
  ["a) Edison was an American inventor.","b) He invented the light bulb in 1789.","c) The phonograph could play sound.","d) Edison had fewer than 100 inventions."],
  ["T","F","T","F"], "VD",
  "a) T (great American inventor); b) F (in 1879, không phải 1789); c) T (could play sound); d) F (more than 1,000)."),
R("Artificial intelligence is changing education. AI can check homework, answer student questions, and design a different lesson for each learner. However, many teachers worry that students will depend too much on AI and stop thinking for themselves.",
  ["a) AI can check students' homework.","b) AI designs the same lesson for every learner.","c) Teachers never worry about AI.","d) Students may stop thinking if they depend too much on AI."],
  ["T","F","F","T"], "VDC",
  "a) T; b) F (a different lesson for each learner); c) F (many teachers worry); d) T."),
short("Give the correct form of the word in brackets: AI stands for Artificial ___ (intelligent).",
    "Intelligence", "VDC",
    "Sau tính từ Artificial cần danh từ: Intelligence (trí tuệ nhân tạo)."),
]})

# ---------------- DE 2 ----------------
sets.append({"name": "Đề 2", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. tell","B. get","C. here","D. well"], "C", "NB",
    "here phát âm /hɪər/ với âm /ɪə/, còn tell, get, well phát âm /e/."),
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. bag","B. map","C. name","D. catch"], "C", "TH",
    "name phát âm /neɪm/ với âm /eɪ/, còn bag, map, catch phát âm /æ/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. science","B. solar","C. agree","D. laptop"], "C", "TH",
    "agree trọng âm rơi vào âm tiết thứ 2 (a-GREE), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("Scientists do ___ in the laboratory to test their ideas.",
    ["A. games","B. experiments","C. songs","D. trips"], "B", "NB",
    "experiment = thí nghiệm; các nhà khoa học làm thí nghiệm để kiểm chứng ý tưởng."),
mcq("A ___ is a tool or machine designed for a special job.",
    ["A. plant","B. device","C. river","D. desk"], "B", "TH",
    "device = thiết bị, dụng cụ dùng cho một công việc cụ thể."),
mcq("'I like science,' she said. → She said that she ___ science.",
    ["A. likes","B. liked","C. like","D. liking"], "B", "NB",
    "Câu tường thuật: 'like' (hiện tại đơn) lùi thành 'liked' (quá khứ đơn)."),
mcq("A: 'The new phone is too expensive.' - B: '___'",
    ["A. I agree with you.","B. Good luck.","C. Never mind.","D. See you later."], "A", "VD",
    "Đồng tình với ý kiến của người nói: 'I agree with you'."),
R("Robots are becoming more and more common in our life. They can work in factories, help doctors in hospitals, and even clean our homes. Some robots can talk to humans and answer simple questions. In the future, robots may do many dangerous jobs instead of people.",
  ["a) Robots work only in factories.","b) Some robots can talk to humans.","c) Robots may do dangerous jobs in the future.","d) Robots can clean our homes."],
  ["F","T","T","T"], "VD",
  "a) F (work in factories, hospitals, homes - không chỉ nhà máy); b) T; c) T; d) T."),
R("Nuclear energy comes from atoms. It can make a lot of electricity from a small amount of fuel. However, nuclear waste is very dangerous and must be kept safe for thousands of years.",
  ["a) Nuclear energy comes from atoms.","b) It makes little electricity.","c) Nuclear waste is safe.","d) Nuclear waste must be kept safe for a very long time."],
  ["T","F","F","T"], "VDC",
  "a) T; b) F (a lot of electricity); c) F (very dangerous); d) T (thousands of years)."),
short("Give the correct form of the verb in brackets: My father said that the Earth ___ (be) round.",
    "is", "VDC",
    "Sự thật hiển nhiên (chân lý) không lùi thì trong câu tường thuật."),
]})

# ---------------- DE 3 ----------------
sets.append({"name": "Đề 3", "questions": [
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. hand","B. bag","C. plane","D. cat"], "C", "NB",
    "plane phát âm /pleɪn/ với âm /eɪ/, còn hand, bag, cat phát âm /æ/."),
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. men","B. ten","C. these","D. end"], "C", "TH",
    "these phát âm /ðiːz/ với âm /iː/, còn men, ten, end phát âm /e/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. engineer","B. doctor","C. photo","D. tablet"], "A", "TH",
    "engineer trọng âm rơi vào âm tiết thứ 2 (en-gi-NEER), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("We use ___ to send messages and go online quickly.",
    ["A. letters","B. smartphones","C. books","D. pens"], "B", "NB",
    "smartphone = điện thoại thông minh, dùng để nhắn tin và lên mạng."),
mcq("My brother is an ___; he designs bridges and buildings.",
    ["A. artist","B. engineer","C. doctor","D. teacher"], "B", "TH",
    "engineer = kỹ sư, người thiết kế cầu đường và nhà cửa."),
mcq("He told ___ that the test was easy.",
    ["A. me","B. I","C. my","D. mine"], "A", "NB",
    "Sau 'told' phải có tân ngữ (me, him, her, them...); không dùng chủ ngữ 'I'."),
mcq("A: 'I think AI will replace teachers one day.' - B: '___'",
    ["A. I don't think so.","B. I agree to.","C. Yes, I will.","D. No, I don't think."], "A", "VD",
    "Bày tỏ ý kiến trái ngược lịch sự: 'I don't think so'."),
R("A smartphone is like a small computer in your pocket. You can use it to call, send messages, take photos, and go online. Many students use smartphones to learn English and do their homework.",
  ["a) A smartphone is like a small computer.","b) You cannot take photos with a smartphone.","c) Students use smartphones for learning.","d) Smartphones can go online."],
  ["T","F","T","T"], "VD",
  "a) T; b) F (take photos được nêu trong bài); c) T (to learn English); d) T."),
R("Scientists are working on self-driving cars. These cars use cameras and computers to see the road. They can stop at red lights and avoid accidents. Self-driving cars may make traffic safer in the future.",
  ["a) Self-driving cars use cameras to see the road.","b) They cannot see red lights.","c) They may make traffic safer.","d) Self-driving cars are already perfect now."],
  ["T","F","T","F"], "VDC",
  "a) T; b) F (can stop at red lights); c) T; d) F (đang nghiên cứu, chưa hoàn hảo)."),
short("Give the correct form of the verb in brackets: He told me ___ (not touch) the machine.",
    "not to touch", "VDC",
    "Cấu trúc: told + tân ngữ + (not) to V: 'told me not to touch'."),
]})

# ---------------- DE 4 ----------------
sets.append({"name": "Đề 4", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. better","B. hello","C. remember","D. we"], "D", "NB",
    "we phát âm /wiː/ với âm /iː/, còn better, hello, remember phát âm /e/."),
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. happy","B. black","C. want","D. plan"], "C", "TH",
    "want phát âm /wɒnt/ với âm /ɒ/, còn happy, black, plan phát âm /æ/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. technology","B. doctor","C. tablet","D. laptop"], "A", "TH",
    "technology trọng âm rơi vào âm tiết thứ 2 (tech-NO-lo-gy), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("A ___ is a small computer you can touch with your fingers.",
    ["A. tablet","B. phone","C. book","D. box"], "A", "NB",
    "tablet = máy tính bảng, điều khiển bằng cách chạm tay lên màn hình."),
mcq("The Internet is a great ___ for learning English.",
    ["A. game","B. tool","C. song","D. toy"], "B", "TH",
    "tool = công cụ; Internet là công cụ tuyệt vời để học tiếng Anh."),
mcq("She said, 'I will come tomorrow.' → She said that she ___ come the next day.",
    ["A. will","B. would","C. can","D. may"], "B", "NB",
    "'will' lùi thành 'would'; 'tomorrow' đổi thành 'the next day'."),
mcq("Teacher: 'What will robots do in the future?' - Student: '___'",
    ["A. They will do our homework.","B. They are expensive.","C. I hate robots.","D. See you later."], "A", "VD",
    "Trả lời đúng câu hỏi về việc robot sẽ làm gì trong tương lai."),
R("The Internet was invented in the 1960s. At first, only scientists used it to share information. Today, billions of people use the Internet every day to study, work, and have fun.",
  ["a) The Internet was invented in 2020.","b) Only scientists used it at first.","c) Billions of people use it today.","d) People use the Internet to study and work."],
  ["F","T","T","T"], "VD",
  "a) F (in the 1960s); b) T; c) T; d) T."),
R("Marie Curie was a famous scientist from Poland. She won the Nobel Prize twice, in physics and chemistry. With her husband, she discovered two new elements. Her work helps doctors treat sick people today.",
  ["a) Marie Curie was a scientist.","b) She won the Nobel Prize three times.","c) She discovered two new elements.","d) Her work is still useful today."],
  ["T","F","T","T"], "VDC",
  "a) T; b) F (twice - hai lần); c) T; d) T (helps doctors today)."),
short("Give the correct form of the word in brackets: The ___ (develop) of technology is very fast.",
    "development", "VDC",
    "Sau mạo từ 'The' cần danh từ: development (sự phát triển)."),
]})

# ---------------- DE 5 ----------------
sets.append({"name": "Đề 5", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. seven","B. every","C. key","D. member"], "C", "NB",
    "key phát âm /kiː/ với âm /iː/, còn seven, every, member phát âm /e/."),
mcq("Choose the word whose underlined 'ea' is pronounced differently from the others.",
    ["A. great","B. meat","C. team","D. clean"], "A", "TH",
    "great phát âm /ɡreɪt/ với âm /eɪ/, còn meat, team, clean phát âm /iː/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. laboratory","B. computer","C. invent","D. robot"], "A", "TH",
    "laboratory trọng âm rơi vào âm tiết thứ 2 (la-BO-ra-to-ry), computer và invent cũng... "),
]})

# DE 5: sua lai cau stress cho dung (computer/invent cung am tiet 2). Viet lai DE 5 hoan chinh:
sets.pop()
sets.append({"name": "Đề 5", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. seven","B. every","C. key","D. member"], "C", "NB",
    "key phát âm /kiː/ với âm /iː/, còn seven, every, member phát âm /e/."),
mcq("Choose the word whose underlined 'ea' is pronounced differently from the others.",
    ["A. great","B. meat","C. team","D. clean"], "A", "TH",
    "great phát âm /ɡreɪt/ với âm /eɪ/, còn meat, team, clean phát âm /iː/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. develop","B. picture","C. laptop","D. robot"], "A", "TH",
    "develop trọng âm rơi vào âm tiết thứ 2 (de-VE-lop), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("My new phone has a very big ___.",
    ["A. screen","B. book","C. bag","D. box"], "A", "NB",
    "screen = màn hình; điện thoại mới có màn hình rất lớn."),
mcq("We need ___ energy to protect the environment.",
    ["A. old","B. renewable","C. dirty","D. dangerous"], "B", "TH",
    "renewable energy = năng lượng tái tạo, thân thiện với môi trường."),
mcq("He said that he ___ in Ha Noi in 2010.",
    ["A. lived","B. lives","C. live","D. is living"], "A", "NB",
    "Câu tường thuật: 'lives' (hiện tại đơn) lùi thành 'lived' (quá khứ đơn)."),
mcq("A: 'How does this robot work?' - B: '___'",
    ["A. It works by voice control.","B. It is small.","C. I like it.","D. Thanks."], "A", "VD",
    "Trả lời đúng câu hỏi 'how' (bằng cách nào): điều khiển bằng giọng nói."),
R("In the past, people wrote letters by hand. Then the telephone was invented, and people could talk over long distances. Today, we can see and talk to each other on video calls thanks to the Internet.",
  ["a) People wrote letters by hand in the past.","b) The telephone lets people talk over long distances.","c) Video calls need the Internet.","d) Letters are faster than video calls."],
  ["T","T","T","F"], "VD",
  "a) T; b) T; c) T (thanks to the Internet); d) F (video calls nhanh hơn thư tay)."),
R("Digital technology has changed our daily life. We can shop, study, and work online without leaving home. However, spending too much time on screens can harm our eyes and health.",
  ["a) Digital technology has changed our life.","b) We can work online from home.","c) Screens are always good for our health.","d) Too much screen time can harm our eyes."],
  ["T","T","F","T"], "VDC",
  "a) T; b) T; c) F (can harm our eyes and health); d) T."),
short("Give the correct form of the verb in brackets: She said she ___ (will) visit us the next day.",
    "would", "VDC",
    "'will' lùi thành 'would' trong câu tường thuật."),
]})

# ---------------- DE 6 (pattern B: TH,VD,VDC,NB,TH,VD,NB,NB,TH,VDC) ----------------
sets.append({"name": "Đề 6", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. meter","B. seven","C. remember","D. develop"], "A", "TH",
    "meter phát âm /ˈmiːtər/ với âm /iː/, còn seven, remember, develop phát âm /e/."),
mcq("Choose the word whose underlined 'ea' is pronounced differently from the others.",
    ["A. dream","B. bread","C. great","D. head"], "A", "VD",
    "dream phát âm /driːm/ với âm /iː/, còn bread, head phát âm /e/ và great phát âm /eɪ/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. discovery","B. planet","C. tablet","D. robot"], "A", "VDC",
    "discovery trọng âm rơi vào âm tiết thứ 2 (dis-CO-ve-ry), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("___ watches can show the time and count your steps.",
    ["A. Digital","B. Paper","C. Wooden","D. Old"], "A", "NB",
    "digital watch = đồng hồ kỹ thuật số, có thể đếm bước chân."),
mcq("He works in a ___, where scientists study chemicals.",
    ["A. library","B. laboratory","C. museum","D. bank"], "B", "TH",
    "laboratory = phòng thí nghiệm, nơi các nhà khoa học nghiên cứu."),
mcq("She said that she ___ the experiment the day before.",
    ["A. does","B. did","C. had done","D. do"], "C", "VD",
    "'did' (quá khứ đơn) lùi thành 'had done' (quá khứ hoàn thành)."),
mcq("A: 'Do you like science?' - B: '___'",
    ["A. Yes, I do.","B. No, I am.","C. Yes, I like.","D. I do not."], "A", "NB",
    "Trả lời câu hỏi Yes/No với trợ động từ do: 'Yes, I do'."),
R("A robot is a machine that can do tasks automatically. Some robots look like humans. They can walk, talk, and even dance. Robots help people in factories and hospitals.",
  ["a) A robot is a kind of machine.","b) No robot looks like a human.","c) Some robots can dance.","d) Robots help people in factories."],
  ["T","F","T","T"], "NB",
  "a) T; b) F (some robots look like humans); c) T; d) T."),
R("Alexander Graham Bell invented the telephone in 1876. It was a great invention. For the first time, people could talk to each other over long distances.",
  ["a) Bell invented the telephone.","b) The telephone was invented in 1876.","c) It was a bad invention.","d) People could talk over long distances."],
  ["T","T","F","T"], "TH",
  "a) T; b) T; c) F (a great invention); d) T."),
short("Give the correct form of the verb in brackets: The scientist said that water ___ (boil) at 100 degrees Celsius.",
    "boils", "VDC",
    "Sự thật hiển nhiên không lùi thì: water boils (hiện tại đơn)."),
]})

# ---------------- DE 7 ----------------
sets.append({"name": "Đề 7", "questions": [
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. water","B. map","C. man","D. dad"], "A", "TH",
    "water phát âm /ˈwɔːtər/ với âm /ɔː/, còn map, man, dad phát âm /æ/."),
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. every","B. never","C. email","D. send"], "C", "VD",
    "email phát âm /ˈiːmeɪl/ với âm /iː/ ở âm tiết đầu, còn every, never, send phát âm /e/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. experiment","B. table","C. picture","D. music"], "A", "VDC",
    "experiment (danh từ) trọng âm rơi vào âm tiết thứ 2 (ex-PE-ri-ment), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("Robots can do many ___ jobs for humans.",
    ["A. dangerous","B. safe","C. easy","D. happy"], "A", "NB",
    "dangerous jobs = những công việc nguy hiểm; robot thay con người làm việc nguy hiểm."),
mcq("___ is the use of machines to do tasks that need human intelligence.",
    ["A. Robot","B. Artificial intelligence","C. Software","D. Device"], "B", "TH",
    "Artificial intelligence (AI) = trí tuệ nhân tạo."),
mcq("They said that they ___ the robot the following week.",
    ["A. test","B. tested","C. will test","D. would test"], "D", "VD",
    "'will' lùi thành 'would' trong câu tường thuật."),
mcq("A: 'Thank you for your help.' - B: '___'",
    ["A. You're welcome.","B. See you.","C. I'm fine.","D. Never."], "A", "NB",
    "Đáp lại lời cảm ơn: 'You're welcome' (không có chi)."),
R("Thomas Edison was a great inventor. He invented the light bulb and the phonograph. He worked very hard every day. Many people call him the king of inventors.",
  ["a) Edison was an inventor.","b) He invented the light bulb.","c) He never worked hard.","d) People call him the king of inventors."],
  ["T","T","F","T"], "NB",
  "a) T; b) T; c) F (worked very hard); d) T."),
R("AI is helping doctors in hospitals. It can read X-ray pictures and find sick parts of the body. AI works very fast and never feels tired. However, doctors still make the final decisions.",
  ["a) AI helps doctors in hospitals.","b) AI can read X-ray pictures.","c) AI never feels tired.","d) AI makes all the final decisions."],
  ["T","T","T","F"], "TH",
  "a) T; b) T; c) T; d) F (doctors still make the final decisions)."),
short("Give the correct form of the verb in brackets: He said he ___ (finish) his homework before dinner.",
    "had finished", "VDC",
    "'finished' (quá khứ đơn) lùi thành 'had finished' (quá khứ hoàn thành)."),
]})

# ---------------- DE 8 ----------------
sets.append({"name": "Đề 8", "questions": [
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. apple","B. after","C. fast","D. dance"], "A", "TH",
    "apple phát âm /ˈæpəl/ với âm /æ/, còn after, fast, dance phát âm /ɑː/."),
mcq("Choose the word whose underlined 'ea' is pronounced differently from the others.",
    ["A. healthy","B. head","C. break","D. weather"], "C", "VD",
    "break phát âm /breɪk/ với âm /eɪ/, còn healthy, head, weather phát âm /e/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. development","B. computer","C. software","D. picture"], "A", "VDC",
    "development trọng âm rơi vào âm tiết thứ 2 (de-VE-lop-ment), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("A ___ is a machine that can do tasks automatically.",
    ["A. robot","B. book","C. pen","D. chair"], "A", "NB",
    "robot = người máy, cỗ máy có thể tự động làm việc."),
mcq("Scientists ___ penicillin by accident in 1928.",
    ["A. invented","B. discovered","C. built","D. wrote"], "B", "TH",
    "discover = khám phá ra thứ đã tồn tại sẵn (penicillin có sẵn trong tự nhiên)."),
mcq("She said, 'I am working now.' → She said that she ___ then.",
    ["A. is working","B. was working","C. works","D. worked"], "B", "VD",
    "'am working' (hiện tại tiếp diễn) lùi thành 'was working' (quá khứ tiếp diễn); 'now' → 'then'."),
mcq("Lan: 'Have you heard about AI?' - Minh: '___'",
    ["A. Yes, it's amazing.","B. I don't know.","C. No, thanks.","D. Goodbye."], "A", "NB",
    "Trả lời câu hỏi Yes/No và bày tỏ cảm xúc: 'Yes, it's amazing'."),
R("A laptop is a small computer you can carry everywhere. Students use laptops to do homework, watch lessons, and play games. You should not use it for too long because it is bad for your eyes.",
  ["a) A laptop is a small computer.","b) You can carry it everywhere.","c) Students use laptops for homework.","d) Using it too long is good for your eyes."],
  ["T","T","T","F"], "NB",
  "a) T; b) T; c) T; d) F (bad for your eyes)."),
R("Satellites fly around the Earth. They help us watch the weather and use GPS on our phones. Scientists send satellites into space with rockets.",
  ["a) Satellites fly around the Earth.","b) They help us watch the weather.","c) GPS works without satellites.","d) Scientists use rockets to send satellites."],
  ["T","T","F","T"], "TH",
  "a) T; b) T; c) F (GPS cần vệ tinh); d) T."),
short("Give the correct form of the verb in brackets: Nam told me ___ (try) my best in the exam.",
    "to try", "VDC",
    "Cấu trúc: told + tân ngữ + to V: 'told me to try'."),
]})

# ---------------- DE 9 ----------------
sets.append({"name": "Đề 9", "questions": [
mcq("Choose the word whose underlined 'ea' is pronounced differently from the others.",
    ["A. bread","B. great","C. head","D. ready"], "B", "TH",
    "great phát âm /ɡreɪt/ với âm /eɪ/, còn bread, head, ready phát âm /e/."),
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. change","B. late","C. small","D. page"], "C", "VD",
    "small phát âm /smɔːl/ với âm /ɔː/, còn change, late, page phát âm /eɪ/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. intelligent","B. robot","C. tablet","D. laptop"], "A", "VDC",
    "intelligent trọng âm rơi vào âm tiết thứ 2 (in-TEL-li-gent), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("We use ___ to take photos and go online.",
    ["A. books","B. pens","C. smartphones","D. rulers"], "C", "NB",
    "smartphone dùng để chụp ảnh và lên mạng."),
mcq("The scientists made a ___ in cancer research last year.",
    ["A. break","B. breakthrough","C. broken","D. breaking"], "B", "TH",
    "breakthrough = bước đột phá; sau mạo từ 'a' cần danh từ."),
mcq("Nam said, 'I have finished my homework.' → Nam said that he ___ his homework.",
    ["A. has finished","B. had finished","C. finishes","D. finish"], "B", "VD",
    "'have finished' (hiện tại hoàn thành) lùi thành 'had finished' (quá khứ hoàn thành)."),
mcq("A: 'See you tomorrow!' - B: '___'",
    ["A. See you.","B. Good morning.","C. Thank you.","D. I'm sorry."], "A", "NB",
    "Đáp lại lời chào tạm biệt: 'See you'."),
R("Computers are very useful machines. We use them to study, work, and play games. The first computers were very big, but now they are small and fast.",
  ["a) Computers are useful machines.","b) We use them to study and work.","c) The first computers were small.","d) Modern computers are fast."],
  ["T","T","F","T"], "NB",
  "a) T; b) T; c) F (were very big); d) T."),
R("Alexander Graham Bell invented the telephone in 1876. Before that, people sent letters to talk to friends far away. The telephone changed the way people communicated.",
  ["a) Bell invented the telephone.","b) It was invented in 1876.","c) People sent emails before the telephone.","d) The telephone changed communication."],
  ["T","T","F","T"], "TH",
  "a) T; b) T; c) F (sent letters, chưa có email); d) T."),
short("Give the correct form of the verb in brackets: He said that he ___ (not go) to school the day before.",
    "had not gone", "VDC",
    "'did not go' (quá khứ đơn) lùi thành 'had not gone' (quá khứ hoàn thành)."),
]})

# ---------------- DE 10 ----------------
sets.append({"name": "Đề 10", "questions": [
mcq("Choose the word whose underlined 'e' is pronounced differently from the others.",
    ["A. seven","B. better","C. these","D. well"], "C", "TH",
    "these phát âm /ðiːz/ với âm /iː/, còn seven, better, well phát âm /e/."),
mcq("Choose the word whose underlined 'a' is pronounced differently from the others.",
    ["A. class","B. fast","C. apple","D. past"], "C", "VD",
    "apple phát âm /ˈæpəl/ với âm /æ/, còn class, fast, past phát âm /ɑː/."),
mcq("Choose the word whose main stress is placed differently from the others.",
    ["A. invention","B. robot","C. tablet","D. doctor"], "A", "VDC",
    "invention trọng âm rơi vào âm tiết thứ 2 (in-VEN-tion), các từ còn lại trọng âm ở âm tiết đầu."),
mcq("A ___ can talk and answer simple questions.",
    ["A. book","B. robot","C. pen","D. chair"], "B", "NB",
    "robot có thể nói chuyện và trả lời câu hỏi đơn giản."),
mcq("The ___ of the telephone changed the world.",
    ["A. experiment","B. invention","C. scientist","D. machine"], "B", "TH",
    "invention = phát minh; phát minh ra điện thoại đã thay đổi thế giới."),
mcq("The teacher said that light ___ faster than sound.",
    ["A. travel","B. travels","C. travelled","D. travelling"], "B", "VD",
    "Sự thật hiển nhiên không lùi thì, giữ nguyên hiện tại đơn: light travels."),
mcq("A: 'Can I use your laptop?' - B: '___'",
    ["A. Sure, go ahead.","B. No, I can't.","C. I don't know.","D. Thanks."], "A", "NB",
    "Đồng ý cho mượn một cách thân thiện: 'Sure, go ahead'."),
R("A tablet is a small computer with a touch screen. You can use it to read books, watch videos, and draw pictures. Many children like playing games on tablets.",
  ["a) A tablet has a touch screen.","b) You can read books on it.","c) You can draw pictures on it.","d) Children hate playing games on tablets."],
  ["T","T","T","F"], "NB",
  "a) T; b) T; c) T; d) F (like playing games)."),
R("In the future, houses may be very smart. Lights will turn on by themselves, and robots will clean the rooms. People will control everything with their voices.",
  ["a) Future houses may be smart.","b) Lights will turn on by themselves.","c) Robots will clean the rooms.","d) People will control everything by hand."],
  ["T","T","T","F"], "TH",
  "a) T; b) T; c) T; d) F (with their voices, không phải by hand)."),
short("Give the correct form of the verb in brackets: They said they ___ (build) a new laboratory the following year.",
    "would build", "VDC",
    "'will build' lùi thành 'would build' trong câu tường thuật."),
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
print("Phan bo U11:", counts)

tpl = io.open("/home/hatch/workspace/anh8/TEMPLATE_baitap.html", encoding="utf-8").read()
out = tpl.replace("@@TITLE@@", "Unit 11: Science and technology")
out = out.replace("@@SUBTITLE@@", "Unit 11: Science and technology • Tiếng Anh 8 (Global Success)")
out = out.replace("@@JSON@@", json.dumps(data, ensure_ascii=False, indent=1))
io.open("/home/hatch/workspace/anh8/staging/ANH_8_Unit_11_Science_and_technology_Bai_tap_none.html",
        "w", encoding="utf-8").write(out)
print("OK U11")
