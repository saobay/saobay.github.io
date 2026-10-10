# -*- coding: utf-8 -*-
"""Sinh 2 file bai tap Anh 8 Units 9 & 10 tu template, kem kiem tra."""
import json, re, pathlib

BASE = pathlib.Path(__file__).parent

def mcq(q, opts, ans, level, explain):
    return {"type": "mcq", "q": q, "options": opts, "answer": ans,
            "level": level, "explain": explain}

def tf(q, stmts, ans, level, explain):
    return {"type": "truefalse", "q": q, "statements": stmts, "answer": ans,
            "level": level, "explain": explain}

def short(q, ans, level, explain):
    return {"type": "short", "q": q, "answer": ans,
            "level": level, "explain": explain}

# ================================================================= UNIT 9
U9 = []

# ------------------------------ De 1
U9.append({"name": "Đề 1", "questions": [
mcq("Choose the word whose underlined 'ou' is pronounced differently from the others.",
    ["A. house", "B. cloud", "C. group", "D. mouse"], "C", "NB",
    "house, cloud, mouse phát âm /aʊ/; group phát âm /uː/ nên khác."),
mcq("Choose the word whose underlined 'ow' is pronounced differently from the others.",
    ["A. know", "B. cow", "C. slow", "D. show"], "B", "NB",
    "know, slow, show phát âm /əʊ/; cow phát âm /aʊ/ nên khác."),
mcq("Choose the word with a different stress pattern from the others.",
    ["A. typhoon", "B. shelter", "C. damage", "D. rescue"], "A", "TH",
    "typhoon trọng âm rơi vào âm tiết thứ 2; các từ còn lại nhấn âm 1."),
mcq("A ______ is a violent storm with very strong winds that moves in a circle.",
    ["A. drought", "B. tornado", "C. flood", "D. landslide"], "B", "NB",
    "tornado (lốc xoáy) là cơn bão có gió xoáy tròn rất mạnh."),
mcq("The government sent food and tents to the ______ of the earthquake.",
    ["A. victims", "B. rescuers", "C. volunteers", "D. warnings"], "A", "TH",
    "victims (nạn nhân) là những người cần được giúp đỡ sau động đất."),
mcq("While we ______ dinner, the lights suddenly went out.",
    ["A. had", "B. have", "C. were having", "D. are having"], "C", "VD",
    "while + quá khứ tiếp diễn diễn tả hành động đang diễn ra thì bị xen ngang."),
mcq("Minh: The storm is coming! What should we do? - Lan: ______",
    ["A. Let's move to a safer place.", "B. Have a nice day!",
     "C. See you later.", "D. It's very kind of you."], "A", "TH",
    "Khi bão đến, câu trả lời hợp lý là di chuyển đến nơi an toàn hơn."),
tf("Read the passage and decide whether the statements are True (T) or False (F).\nLast night, a strong earthquake hit the coast of Japan at 11 p.m. Many people were sleeping when it happened. Rescue teams arrived within 30 minutes and helped the victims move to safe shelters. The government warned people to stay away from damaged buildings.",
    ["a) The earthquake happened in the morning.",
     "b) Many people were sleeping when the earthquake struck.",
     "c) Rescue teams arrived within half an hour.",
     "d) People were told to stay in damaged buildings."],
    ["F", "T", "T", "F"], "VD",
    "a) sai vì động đất xảy ra lúc 11 giờ đêm; d) sai vì chính phủ cảnh báo tránh xa tòa nhà hư hại."),
tf("Read the passage and decide whether the statements are True (T) or False (F).\nTyphoon Yagi was the strongest storm to hit Vietnam in 2024. It made landfall in Quang Ninh on September 7, with winds of over 200 km/h. Thousands of houses lost their roofs, and many trees fell down. After the storm, volunteers from all over the country brought food and clean water to the victims.",
    ["a) Typhoon Yagi hit Vietnam in 2024.",
     "b) It made landfall in Quang Ninh on September 7.",
     "c) The storm caused no damage to houses.",
     "d) Volunteers helped the victims with food and water."],
    ["T", "T", "F", "T"], "VDC",
    "c) sai vì hàng nghìn ngôi nhà bị tốc mái; các ý còn lại đúng theo bài."),
short("We ______ (watch) TV when the storm suddenly came.",
     "were watching", "VDC",
     "Hành động đang diễn ra trong quá khứ (xem TV) bị hành động khác xen vào nên dùng quá khứ tiếp diễn."),
]})

# ------------------------------ De 2
U9.append({"name": "Đề 2", "questions": [
mcq("Choose the word whose underlined 'ou' is pronounced differently from the others.",
    ["A. shout", "B. ground", "C. should", "D. proud"], "C", "NB",
    "shout, ground, proud phát âm /aʊ/; should phát âm /ʊ/ nên khác."),
mcq("Choose the word whose underlined 'oa' is pronounced differently from the others.",
    ["A. boat", "B. road", "C. broad", "D. coast"], "C", "NB",
    "boat, road, coast phát âm /əʊ/; broad phát âm /ɔː/ nên khác."),
mcq("Choose the word with a different stress pattern from the others.",
    ["A. tsunami", "B. rescue", "C. shelter", "D. damage"], "A", "TH",
    "tsunami trọng âm rơi vào âm tiết thứ 2; các từ còn lại nhấn âm 1."),
mcq("When a volcano ______, hot lava flows out.",
    ["A. erupts", "B. shakes", "C. floods", "D. warns"], "A", "NB",
    "erupt (phun trào) là động từ dùng cho núi lửa."),
mcq("People were asked to ______ the village before the flood came.",
    ["A. rescue", "B. damage", "C. evacuate", "D. warn"], "C", "TH",
    "evacuate (sơ tán) nghĩa là di chuyển người dân đến nơi an toàn."),
mcq("I ______ when my mother called me.",
    ["A. slept", "B. was sleeping", "C. sleep", "D. am sleeping"], "B", "VD",
    "Hành động đang diễn ra (was sleeping) bị hành động khác xen vào (called)."),
mcq("A: Are you OK after the earthquake? - B: ______",
    ["A. Yes, I'm fine, thank you.", "B. It's a sunny day.",
     "C. I like earthquakes.", "D. Goodbye!"], "A", "TH",
    "Câu hỏi thăm sau động đất, đáp lại lịch sự là 'Tôi ổn, cảm ơn'."),
tf("Read the passage and decide whether the statements are True (T) or False (F).\nEvery year, the Mekong Delta faces serious floods in the rainy season. Last October, water rose very fast and covered many rice fields. Farmers moved their animals to higher ground. Schools in the area closed for two weeks.",
    ["a) Floods happen in the Mekong Delta every rainy season.",
     "b) The water rose slowly last October.",
     "c) Farmers moved their animals to higher ground.",
     "d) Schools stayed open during the flood."],
    ["T", "F", "T", "F"], "VD",
    "b) sai vì nước dâng rất nhanh; d) sai vì trường học đóng cửa hai tuần."),
tf("Read the passage and decide whether the statements are True (T) or False (F).\nA long drought hit the central region of Vietnam this year. There was no rain for nearly five months. Rice fields dried up and many families did not have enough clean water. The government is building more reservoirs to store water for the dry season.",
    ["a) The drought lasted nearly five months without rain.",
     "b) Rice fields grew well during the drought.",
     "c) Many families lacked clean water.",
     "d) The government is doing nothing to help."],
    ["T", "F", "T", "F"], "VDC",
    "b) sai vì ruộng lúa khô héo; d) sai vì chính phủ đang xây thêm hồ chứa nước."),
short("While the children ______ (play) in the yard, it started to rain heavily.",
     "were playing", "VDC",
     "Sau while là quá khứ tiếp diễn vì đó là hành động dài đang diễn ra."),
]})
