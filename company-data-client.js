(() => {
  const SUPABASE_URL = "https://ioznepuggdzagmckljbp.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_JAPUbLW_UTupYjKxmWFCXg_NicyJxn5";

  const CATEGORY_ORDER = ["overview", "business", "recruitment", "workstyle", "benefits", "performance"];
  const CATEGORY_LABELS = {
    overview: "企業概要",
    business: "仕事内容・事業",
    recruitment: "給与・採用",
    workstyle: "働き方",
    benefits: "福利厚生",
    performance: "業績"
  };
  const FIELD_META = {
    industry: ["overview", "業界・事業領域"],
    business_description: ["overview", "事業内容"],
    headquarters: ["overview", "本社"],
    founded_year: ["overview", "設立・創業"],
    employee_count: ["overview", "従業員数"],
    employee_count_consolidated: ["overview", "連結従業員数"],
    official_website: ["overview", "公式サイト"],

    main_business: ["business", "主力事業"],
    main_products: ["business", "主力サービス・製品"],
    main_customers: ["business", "主な顧客"],
    business_model_summary: ["business", "ビジネスモデル"],
    company_strength: ["business", "公式資料で確認できる強み"],
    career_program: ["business", "職種・キャリア"],

    base_salary: ["recruitment", "基本給"],
    starting_salary: ["recruitment", "初任給・月給・年俸"],
    average_salary: ["recruitment", "平均年収"],
    work_location: ["recruitment", "勤務地"],
    recruitment_count: ["recruitment", "採用人数"],
    bonus: ["recruitment", "賞与"],
    salary_review: ["recruitment", "給与改定"],
    allowances: ["recruitment", "その他手当"],
    compensation_policy: ["recruitment", "昇給・賞与・評価"],

    annual_holidays: ["workstyle", "年間休日"],
    holidays: ["workstyle", "休日"],
    paid_leave_days: ["workstyle", "年次有給休暇"],
    paid_leave_usage_rate: ["workstyle", "有給取得率"],
    average_overtime: ["workstyle", "平均残業"],
    remote_work: ["workstyle", "リモートワーク"],
    flex_time: ["workstyle", "フレックスタイム"],
    side_job_allowed: ["workstyle", "副業"],
    working_hours: ["workstyle", "勤務時間"],
    workstyle_overview: ["workstyle", "勤務制度・休日"],

    housing_allowance: ["benefits", "住宅補助"],
    training_program: ["benefits", "研修・能力開発"],
    maternity_leave: ["benefits", "産前産後休業"],
    childcare_leave: ["benefits", "育児支援"],
    benefits_other: ["benefits", "その他福利厚生"],

    revenue: ["performance", "売上高・売上収益"],
    operating_income: ["performance", "営業利益"],
    growth_rate: ["performance", "成長率"],
    overseas_ratio: ["performance", "海外比率"],
    average_age: ["performance", "平均年齢"],
    average_tenure: ["performance", "平均勤続年数"],
    performance_summary: ["performance", "公式業績情報"]
  };

  const NON_VALUES = new Set(["", "null", "undefined", "不明", "情報なし", "なし", "n/a", "N/A", "-", "—"]);

  function isPresent(point) {
    if (!point || point.confidence !== "high") return false;
    const value = point.display_value;
    if (value === null || value === undefined) return false;
    const displayValue = String(value).trim();
    return displayValue.length > 0 && !NON_VALUES.has(displayValue) && Boolean(point.source_url);
  }

  async function fetchVerifiedProfile(lookup) {
    if (!lookup) return null;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_company_profile`, {
      method: "POST",
      headers: {
        apikey: PUBLISHABLE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_lookup: String(lookup) })
    });
    if (!response.ok) throw new Error(`Verified company data: ${response.status}`);
    const body = await response.json();
    if (!body || !body.company) return null;
    body.data_points = (body.data_points || []).filter(isPresent);
    return body;
  }

  function group(profile) {
    const buckets = {};
    CATEGORY_ORDER.forEach(key => { buckets[key] = []; });
    for (const point of profile?.data_points || []) {
      if (!isPresent(point)) continue;
      const meta = FIELD_META[point.field_name];
      if (!meta) continue;
      buckets[meta[0]].push({ ...point, label: meta[1] });
    }
    return CATEGORY_ORDER
      .map(key => ({ key, label: CATEGORY_LABELS[key], points: buckets[key] }))
      .filter(category => category.points.length > 0);
  }

  function point(profile, fieldName) {
    return (profile?.data_points || []).find(item => item.field_name === fieldName && isPresent(item)) || null;
  }

  function uniqueSources(profile) {
    const seen = new Set();
    return (profile?.data_points || []).filter(isPresent).filter(item => {
      if (seen.has(item.source_url)) return false;
      seen.add(item.source_url);
      return true;
    });
  }

  function quality(profile) {
    const points = (profile?.data_points || []).filter(isPresent);
    const verifiedFields = points.length;
    const sourceCoverageRate = verifiedFields ? Math.round(points.filter(point => point.source_url).length / verifiedFields * 100) : 0;
    const highConfidenceRate = verifiedFields ? Math.round(points.filter(point => point.confidence === "high").length / verifiedFields * 100) : 0;
    const dates = points.map(point => point.verified_at).filter(Boolean).sort();
    return {
      verifiedFields,
      sourceCoverageRate,
      highConfidenceRate,
      lastVerifiedAt: dates.length ? dates[dates.length - 1] : null
    };
  }

  window.VICompanyData = {
    fetchVerifiedProfile,
    group,
    point,
    uniqueSources,
    quality,
    categoryLabels: CATEGORY_LABELS,
    fieldMeta: FIELD_META,
    isPresent
  };
})();
