# 费用流（MinCostFlow）

先 `MinCostFlow<i64>(n)`，用 `addEdge(u,v,cap,cost)` 加边；`flow(s,t)` 返回流量和总费用。

有向网络，容量非负、费用可为负；源点 s 与汇点 t 不同；初始正容量残量网络无负环。 点下标 0..n-1；T 用 int 或 i64，容量及正负单边费用均须可表示。 每次增广后的累计流量须能放入 T，累计费用须能放入 i64。 flow 改写残量网络，返回本次新增流量和费用；无路为 {0,0}；结果按加边顺序。

初始势能最坏 O(nm)，增广 O(A(n+m)log n)，A 为增广次数；空间 O(n+m)。

```cpp
template <class T>
// Dijkstra 势能最小费用最大流
struct MinCostFlow {
    // 内部残量边
    struct _Edge {
        int to;
        T cap;
        T cost;
        _Edge(int to_, T cap_, T cost_) : to(to_), cap(cap_), cost(cost_) {}
    };

    int n = 0;
    std::vector<_Edge> e;
    std::vector<std::vector<int>> g;
    std::vector<i128> h, dis;
    std::vector<int> pre;

    static constexpr i128 INF = (i128(1) << 120);

    // 创建未初始化对象；使用前调用 init
    MinCostFlow() {}
    // 创建 n 个点的空网络
    explicit MinCostFlow(int n_) {
        init(n_);
    }

    // 重置为 n 个点的空网络
    void init(int n_) {
        n = n_;
        e.clear();
        g.assign(n, {});
    }

    // 加入有向容量费用边
    void addEdge(int u, int v, T cap, T cost) {
        g[u].push_back(int(e.size()));
        e.emplace_back(v, cap, cost);
        g[v].push_back(int(e.size()));
        e.emplace_back(u, T(0), T(-cost));
    }

    // 计算初始势能；要求初始正容量残量网络无负环
    bool initPotential(int s) {
        h.assign(n, 0);
        std::vector<i128> d(n, INF);
        std::vector<bool> inq(n, false);
        std::queue<int> q;
        d[s] = 0;
        q.push(s);
        inq[s] = true;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            inq[u] = false;
            for (int i : g[u]) {
                if (e[i].cap <= 0) {
                    continue;
                }
                int v = e[i].to;
                if (d[v] > d[u] + i64(e[i].cost)) {
                    d[v] = d[u] + i64(e[i].cost);
                    if (!inq[v]) {
                        q.push(v);
                        inq[v] = true;
                    }
                }
            }
        }
        for (int i = 0; i < n; i++) {
            if (d[i] < INF) {
                h[i] = d[i];
            }
        }
        return d[s] == 0;
    }

    // 用约化费用寻找一条可增广路
    bool dijkstra(int s, int t) {
        dis.assign(n, INF);
        pre.assign(n, -1);
        std::priority_queue<std::pair<i128, int>, std::vector<std::pair<i128, int>>,
                            std::greater<std::pair<i128, int>>>
            que;
        dis[s] = 0;
        que.emplace(0, s);
        while (!que.empty()) {
            auto [d, u] = que.top();
            que.pop();
            if (dis[u] != d) {
                continue;
            }
            for (int i : g[u]) {
                if (e[i].cap <= 0) {
                    continue;
                }
                int v = e[i].to;
                i128 nd = d + i128(e[i].cost) + h[u] - h[v];
                if (dis[v] > nd) {
                    dis[v] = nd;
                    pre[v] = i;
                    que.emplace(nd, v);
                }
            }
        }
        return dis[t] < INF;
    }

    // 继续增广并返回新增流量和费用
    std::pair<T, i64> flow(int s, int t) {
        initPotential(s);
        T f = 0;
        i64 cost = 0;
        while (dijkstra(s, t)) {
            for (int i = 0; i < n; ++i) {
                if (dis[i] < INF) {
                    h[i] += dis[i];
                }
            }
            T aug = std::numeric_limits<T>::max();
            for (int i = t; i != s; i = e[pre[i] ^ 1].to) {
                aug = std::min(aug, e[pre[i]].cap);
            }
            for (int i = t; i != s; i = e[pre[i] ^ 1].to) {
                e[pre[i]].cap -= aug;
                e[pre[i] ^ 1].cap += aug;
            }
            f += aug;
            cost += i64(aug) * (h[t] - h[s]);
        }
        return {f, cost};
    }

    // 一条原始有向边及其容量、单位费用和累计流量
    struct Edge {
        int from, to;
        T cap, cost, flow;
    };

    // 按加边顺序返回原始边及流量
    std::vector<Edge> edges() const {
        std::vector<Edge> a;
        for (int i = 0; i < int(e.size()); i += 2) {
            a.push_back({e[i + 1].to, e[i].to, e[i].cap + e[i + 1].cap, e[i].cost, e[i + 1].cap});
        }
        return a;
    }
};
```
