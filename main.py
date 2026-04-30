
import random
import time

# =========================
# Agent 1: Trend Agent
# =========================
class TrendAgent:
    def __init__(self):
        self.base_topics = [
            "AI工具", "效率提升", "副业赚钱", "编程学习", "自媒体运营"
        ]

    def generate_topics(self, keyword, strategy_bias=None):
        topics = []
        for i in range(3):
            base = strategy_bias if strategy_bias else random.choice(self.base_topics)
            topic = f"{keyword} + {base} 的 {random.randint(3,10)} 个技巧"
            topics.append(topic)

        print("\n[Trend Agent] 推荐选题：")
        for i, t in enumerate(topics):
            print(f"{i+1}. {t}")
        return topics


# =========================
# Agent 2: Content Agent
# =========================
class ContentAgent:
    def generate_content(self, topic):
        return f"""标题：{topic}

正文：
1. 核心观点：{topic} 是当前热点方向
2. 方法总结：掌握3个关键技巧即可提升效果
3. 实操建议：持续优化内容策略

#标签：#AI #增长 #运营
"""


# =========================
# Agent 3: Publish Agent
# =========================
class PublishAgent:
    def publish(self, contents):
        print("\n[Publish Agent] 正在发布内容...")
        time.sleep(1)
        print("已发布到：知乎 / 小红书（模拟）")
        return [random.randint(500, 5000) for _ in contents]


# =========================
# Agent 4: Analytics Agent
# =========================
class AnalyticsAgent:
    def analyze(self, topics, views):
        print("\n[Analytics Agent] 数据分析结果：")
        results = dict(zip(topics, views))
        for t, v in results.items():
            print(f"{t} -> 阅读量：{v}")
        best_topic = max(results, key=results.get)
        return best_topic, results


# =========================
# Agent 5: Strategy Agent
# =========================
class StrategyAgent:
    def optimize(self, best_topic):
        print("\n[Strategy Agent] 策略优化：")
        if "工具" in best_topic:
            bias = "AI工具"
        elif "赚钱" in best_topic:
            bias = "副业赚钱"
        else:
            bias = "效率提升"

        print(f"下一轮优化方向：{bias}")
        return bias


# =========================
# 主流程
# =========================
def run_pipeline(keyword="AI", rounds=3):
    trend_agent = TrendAgent()
    content_agent = ContentAgent()
    publish_agent = PublishAgent()
    analytics_agent = AnalyticsAgent()
    strategy_agent = StrategyAgent()

    strategy_bias = None

    for r in range(rounds):
        print(f"\n================= 第 {r+1} 轮 =================")

        topics = trend_agent.generate_topics(keyword, strategy_bias)
        contents = [content_agent.generate_content(t) for t in topics]
        views = publish_agent.publish(contents)
        best_topic, _ = analytics_agent.analyze(topics, views)
        strategy_bias = strategy_agent.optimize(best_topic)


if __name__ == "__main__":
    run_pipeline()
