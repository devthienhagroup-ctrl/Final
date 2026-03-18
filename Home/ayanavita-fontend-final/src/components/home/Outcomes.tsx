import React from "react";

interface OutcomeCard {
  title: string;
  items: string[];
}

interface OutcomesCMSData {
  heading: string;
  subheading: string;
  cards: OutcomeCard[];
}

interface OutcomesProps {
  cmsData?: OutcomesCMSData;
}

export const Outcomes: React.FC<OutcomesProps> = ({ cmsData }) => {
  // Dữ liệu mặc định nếu không có cmsData
  const defaultData: OutcomesCMSData = {
    heading: "Bạn sẽ nhận được gì sau trải nghiệm?",
    subheading:
                            'AYANAVITA cam kết giúp bạn hiểu rõ cơ thể của mình, khôi phục sự cân bằng, và xây dựng một cuộc sống khỏe mạnh, trọn vẹn — một cách tự nhiên và bền vững.',
    cards: [
      {
        title: "Hiểu rõ cơ thể của mình",
        items: [
          "Nhận được những insight giúp hiểu rõ trạng thái cơ thể và mức năng lượng hiện tại.",
          "Nhận diện những yếu tố ảnh hưởng đến sức khỏe, làn da và tinh thần.",
          "Hiểu rõ hơn nhu cầu chăm sóc cá nhân của cơ thể.",
        ],
      },
      {
        title: "Những gợi ý chăm sóc phù hợp",
        items: [
          "Nhận các gợi ý chăm sóc wellness dựa trên dữ liệu và tình trạng cá nhân.",
          "Biết nên ưu tiên những phương pháp chăm sóc nào cho cơ thể và làn da.",
          "Có định hướng rõ ràng cho các bước chăm sóc tiếp theo.",
        ],
      },
      {
        title: "Lộ trình wellness cá nhân hoá",
        items: [
          "Xây dựng một lộ trình chăm sóc sức khỏe phù hợp với nhu cầu của bạn.",
          "Theo dõi và điều chỉnh hành trình wellness theo từng giai đoạn.",
          "Duy trì thói quen chăm sóc bản thân một cách bền vững.",
        ],
      },
      {
        title: "Một phong cách sống cân bằng hơn",
        items: [
          "Học cách lắng nghe và chăm sóc cơ thể đúng cách.",
          "Cải thiện sự cân bằng giữa sức khỏe thể chất và tinh thần.",
          "Hình thành lối sống wellness tích cực và lâu dài.",
        ],
      },
    ],
  };

  const data = cmsData || defaultData;

  return (
      <section id="outcomes" className="w-full pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-sm">
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {data.heading}
                </h2>
                <p className="mt-2 bg-gradient-to-r from-lime-700 via-green-700 to-emerald-700 bg-clip-text text-transparent">{data.subheading}</p>
              </div>

              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                {data.cards.map((card, index) => (
                    <div
                        key={index}
                        className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 ring-1 ring-slate-200"
                    >
                      <div className="font-semibold text-slate-900">{card.title}</div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {card.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-extrabold text-amber-600">•</span>
                              <span>{item}</span>
                            </li>
                        ))}
                      </ul>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};
