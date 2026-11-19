import type { Tone } from "./types";

type Row = [sec: string, en: string, zh: string, ex: string, tone: Tone];

export const RAW: Record<"chat" | "coffee" | "vocab", Row[]> = {
chat: [
["打招呼和破冰","How's your week been so far?","你這週過得怎麼樣？","How's your week been so far? Mine's been mental.","casual"],
["打招呼和破冰","Where are you from originally?","你老家是哪裡？","Where are you from originally? I grew up in Taiwan.","neutral"],
["打招呼和破冰","How are you finding the programme so far?","你覺得這個課程到目前怎麼樣？","How are you finding the programme so far? The workload is heavier than I expected.","neutral"],
["打招呼和破冰","I don't think we've met properly. I'm Martin.","我們好像還沒正式認識，我是 Martin。","","neutral"],
["打招呼和破冰","What brought you to London?","你怎麼會來倫敦？","What brought you to London? Was it the course or the city?","neutral"],
["打招呼和破冰","Long time no see!","好久不見！","Long time no see! How have you been?","casual"],

["聊課業和 group work","Did you manage to finish the problem set?","你寫完 problem set 了嗎？","Did you manage to finish the problem set? I'm stuck on the last part.","casual"],
["聊課業和 group work","Do you mind if I join your group?","介意我加入你們這組嗎？","Do you mind if I join your group? We're one person short.","neutral"],
["聊課業和 group work","Could we split the work by section?","我們可以按章節分工嗎？","Could we split the work by section and meet again on Thursday?","neutral"],
["聊課業和 group work","I'll take care of the data cleaning, if that works for you.","資料清理我來處理，你們覺得可以嗎？","I'll take care of the data cleaning, if that works for you. Someone else can do the charts.","neutral"],
["聊課業和 group work","Can you walk me through how you got that?","你可以帶我看一下你是怎麼算出來的嗎？","Can you walk me through how you got that? I ended up with a different number.","neutral"],
["聊課業和 group work","I'm a bit lost on question three.","我卡在第三題了。","I'm a bit lost on question three. Did you use the same formula?","casual"],
["聊課業和 group work","Shall we sync again on Thursday?","我們週四再對一下進度好嗎？","Shall we sync again on Thursday once everyone has done their part?","neutral"],

["約人和邀約","Are you around this weekend?","你這週末在嗎？","Are you around this weekend? A few of us are going to Borough Market.","casual"],
["約人和邀約","Fancy grabbing a coffee after the lecture?","下課後想去喝杯咖啡嗎？","Fancy grabbing a coffee after the lecture? I need a break.","casual"],
["約人和邀約","We're heading to the pub after class, you should come.","下課後我們要去酒吧，你要一起來。","We're heading to the pub after class, you should come along.","casual"],
["約人和邀約","I'm up for it.","我可以啊，我有興趣。","Dinner on Friday? Yeah, I'm up for it.","casual"],
["約人和邀約","Count me in.","算我一個。","Count me in. What time are we meeting?","casual"],
["約人和邀約","I'll have to pass this time, but let's do it another time.","這次我先不去，下次再約。","I'll have to pass this time, I've got a deadline, but let's do it another time.","neutral"],

["附和和回應","That makes sense.","有道理。","That makes sense. I hadn't thought about it that way.","neutral"],
["附和和回應","Fair enough.","好吧，也合理。","You'd rather work alone? Fair enough.","casual"],
["附和和回應","Tell me about it.","我懂，我超有同感。","The reading list is huge. Tell me about it.","casual"],
["附和和回應","No way, seriously?","不會吧，真的嗎？","They moved the exam to Monday? No way, seriously?","casual"],
["附和和回應","I couldn't agree more.","我完全同意。","I couldn't agree more. The first week felt far too packed.","neutral"],
["附和和回應","That's a good shout.","這個提議不錯。（英式）","Doing it in the library? That's a good shout.","casual"],

["同意或不同意","I see where you're coming from, but...","我懂你的想法，不過……","I see where you're coming from, but I think the sample is too small.","neutral"],
["同意或不同意","I'm not sure I'd go that far.","我不確定能同意到那個程度。","I'm not sure I'd go that far. It depends on the industry.","neutral"],
["同意或不同意","To be fair, ...","公平地說，……","To be fair, they did have limited data.","neutral"],
["同意或不同意","I'm on the fence about it.","這件事我還在猶豫。","I'm on the fence about the finance elective.","casual"],
["同意或不同意","Could you say a bit more about that?","你可以多說一點嗎？","Could you say a bit more about that? I want to make sure I follow.","neutral"],

["沒聽清楚時","Sorry, could you say that again?","抱歉，可以再說一次嗎？","Sorry, could you say that again? The room is quite loud.","neutral"],
["沒聽清楚時","Sorry, I didn't catch that.","抱歉，我沒聽清楚。","Sorry, I didn't catch that last part.","neutral"],
["沒聽清楚時","Do you mean...?","你的意思是……嗎？","Do you mean we should submit before the lecture?","neutral"],
["沒聽清楚時","Just so I've got this right, ...","我確認一下我有沒有理解對：……","Just so I've got this right, we're meeting at two, not three?","neutral"],

["結束對話","I should dash, I've got a class at two.","我該趕過去了，兩點有課。","I should dash, I've got a class at two. Catch you later!","casual"],
["結束對話","It was really nice chatting.","跟你聊天很開心。","It was really nice chatting. Let's do it again soon.","neutral"],
["結束對話","Let's keep in touch.","保持聯絡。","Let's keep in touch. I'll add you on LinkedIn.","neutral"],
["結束對話","See you around!","回頭見！","See you around! Good luck with the presentation.","casual"]
],

coffee: [
["自我介紹","Thanks so much for making time to speak with me.","謝謝你願意抽空跟我聊。","Thanks so much for making time to speak with me. I know your week is busy.","formal"],
["自我介紹","I'm currently doing a Masters in Analytics and Management at LBS.","我目前在 LBS 讀 Analytics and Management 碩士。","","neutral"],
["自我介紹","Before this, I studied business at National Taiwan University.","在這之前我在台大讀企管。","Before this, I studied business at National Taiwan University and did a few internships.","neutral"],
["自我介紹","I come from a frontend development background, so I'm drawn to product work.","我有前端開發背景，所以對產品工作很有興趣。","","neutral"],
["自我介紹","I'm exploring roles in product and business operations at scale-ups.","我正在探索 scale-up 裡的產品和 business operations 職位。","","neutral"],

["問對方的職涯","How did you get into your current role?","你是怎麼走到現在這個職位的？","How did you get into your current role? Was it a planned move?","neutral"],
["問對方的職涯","What does a typical week look like for you?","你一般一週的工作是什麼樣子？","","neutral"],
["問對方的職涯","What do you enjoy most about working here?","你最喜歡在這裡工作的哪一點？","","neutral"],
["問對方的職涯","What's the biggest challenge the team is facing at the moment?","團隊目前面對的最大挑戰是什麼？","","neutral"],
["問對方的職涯","What skills have mattered most in your career so far?","到目前為止，哪些技能對你的職涯最重要？","","neutral"],
["問對方的職涯","If you were in my shoes, what would you focus on?","如果你是我，你會把重點放在哪裡？","If you were in my shoes, what would you focus on over the next six months?","neutral"],
["問對方的職涯","How would you describe the culture here?","你會怎麼形容這裡的文化？","","neutral"],

["表達興趣","I've been following the company's growth for a while.","我關注貴公司的成長有一段時間了。","I've been following the company's growth for a while, especially the move into Europe.","formal"],
["表達興趣","What really appeals to me is...","真正吸引我的是……","What really appeals to me is how much ownership people get early on.","neutral"],
["表達興趣","That's a really interesting way to look at it.","這個看法很有意思。","","neutral"],
["表達興趣","I'd love to learn more about how your team works.","我很想多了解你們團隊怎麼運作。","","neutral"],

["請對方推薦","Is there anyone else you'd recommend I speak to?","有沒有其他人你建議我聊聊？","","neutral"],
["請對方推薦","Are there any resources you'd suggest I read?","有什麼資料你建議我讀？","","neutral"],
["請對方推薦","Would you be open to a follow-up chat in a few weeks?","幾週後你方便再聊一次嗎？","","formal"],
["請對方推薦","Would it be alright if I reached out again with questions?","之後有問題的話，我可以再聯絡你嗎？","","formal"],

["結尾和 follow-up","I really appreciate your time and advice.","非常感謝你的時間和建議。","","formal"],
["結尾和 follow-up","That was incredibly helpful.","這對我幫助很大。","That was incredibly helpful. I'll look into the programme you mentioned.","neutral"],
["結尾和 follow-up","I'll drop you a note to say thanks.","我會再寄信向你道謝。","","neutral"],
["結尾和 follow-up","Thank you again. I really enjoyed our conversation about...","再次感謝。我很喜歡我們聊到的……","Thank you again. I really enjoyed our conversation about product ownership.","formal"],
["結尾和 follow-up","I'll keep you posted on how it goes.","後續進展我會再跟你說。","","neutral"],

["面試回答句型","One example that comes to mind is...","我想到一個例子是……","One example that comes to mind is a group project at university.","neutral"],
["面試回答句型","The situation was..., and my task was to...","當時的情況是……，我的任務是……（STAR 的 S 和 T）","The situation was a tight deadline, and my task was to coordinate five people.","formal"],
["面試回答句型","What I did was...","我做的事情是……（STAR 的 A）","What I did was break the problem into three smaller parts.","neutral"],
["面試回答句型","As a result, we managed to...","結果我們成功……（STAR 的 R）","As a result, we managed to ship two weeks early.","neutral"],
["面試回答句型","Looking back, I'd do ... differently.","回頭看，我會在……上做不同的處理。","Looking back, I'd involve the stakeholders earlier.","neutral"],
["面試回答句型","I took ownership of...","我負責主導……","I took ownership of the onboarding flow from start to finish.","neutral"],
["面試回答句型","I'd approach it in three steps.","我會用三個步驟處理。","","neutral"],
["面試回答句型","What drew me to this role is...","吸引我應徵這個職位的是……","","neutral"],

["不確定時的緩衝句","Give me a second to gather my thoughts.","讓我整理一下想法。","","neutral"],
["不確定時的緩衝句","I'm not certain, but my instinct would be...","我不確定，但我的直覺是……","","neutral"],
["不確定時的緩衝句","Could I take a moment to structure my answer?","我可以先花一點時間組織答案嗎？","","formal"],
["不確定時的緩衝句","I haven't come across that before, but here's how I'd work it out.","這個我沒遇過，不過我會這樣推導。","","neutral"]
],

vocab: [
["職場和商業","stakeholder","利害關係人","We need to get the key stakeholders on board early.","neutral"],
["職場和商業","bandwidth","精力、餘裕","I don't have the bandwidth for another project this term.","casual"],
["職場和商業","trade-off","取捨","There's a trade-off between speed and accuracy here.","neutral"],
["職場和商業","ramp up","逐步加快、慢慢上手","It took me about a month to ramp up in the new role.","neutral"],
["職場和商業","scope","範圍","Let's agree the scope before we start.","neutral"],
["職場和商業","deliverable","交付成果","The main deliverable is a ten-page report.","formal"],
["職場和商業","buy-in","認同與支持","We won't get buy-in without a clear business case.","neutral"],
["職場和商業","touch base","簡單聯絡、對一下進度","Let's touch base on Friday.","casual"],

["Analytics 用語","hypothesis","假設","Our hypothesis is that discounts increase repeat purchases.","neutral"],
["Analytics 用語","confounder","干擾變數","Age could be a confounder in this comparison.","formal"],
["Analytics 用語","overfitting","過度擬合","The model is overfitting to the training data.","formal"],
["Analytics 用語","baseline","基準","We need a simple baseline to compare against.","neutral"],
["Analytics 用語","outlier","離群值","One outlier is pulling the average up.","neutral"],
["Analytics 用語","causal effect","因果效應","Correlation alone doesn't prove a causal effect.","formal"],
["Analytics 用語","iterate","反覆改進","We'll iterate on the model once we get feedback.","neutral"],

["常用搭配","draw a conclusion","得出結論","It's too early to draw a conclusion from one week of data.","neutral"],
["常用搭配","meet a deadline","趕上期限","We should be able to meet the deadline if we start now.","neutral"],
["常用搭配","raise a concern","提出疑慮","I'd like to raise a concern about the timeline.","formal"],
["常用搭配","reach a consensus","達成共識","The group reached a consensus after a short discussion.","formal"],
["常用搭配","take the initiative","主動出手","She took the initiative and set up the first meeting.","neutral"],

["口語 phrasal verbs","follow up on","跟進","I'll follow up on that with the recruiter.","neutral"],
["口語 phrasal verbs","wrap up","收尾、結束","Let's wrap up in five minutes.","casual"],
["口語 phrasal verbs","run through","快速過一遍","Can we run through the slides before the meeting?","casual"],
["口語 phrasal verbs","circle back","晚點再回來討論","Let's circle back to pricing once we have the numbers.","casual"],
["口語 phrasal verbs","figure out","弄清楚","I'm still trying to figure out which course to take.","casual"],
["口語 phrasal verbs","reach out","主動聯絡","Feel free to reach out if you have any questions.","neutral"]
]
}
