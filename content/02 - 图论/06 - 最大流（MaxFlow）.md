# 最大流（MaxFlow）

先 `MaxFlow<i64>(n)`，用 `addEdge(u,v,cap)` 加边；`flow(s,t)` 求流量后，才能用 `minCut()` 读取割。

有向容量网络，容量非负；源点 s 与汇点 t 不同；总流量能由容量类型表示。 点下标 0..n-1；flow 改写残量网络，重复调用返回本次新增流量。 完整 flow 后才可 minCut；边结果按加边顺序，cap 是原容量，flow 是当前累计流量。

一般图 O(n^2 m)，单位网络 O(m sqrt(n)) 时间，O(n + m) 空间。

```cpp
template <class T>
// Dinic 最大流
struct MaxFlow {
    // 内部残量边
    struct _Edge {
        int to;
        T cap;
        _Edge(int to_, T cap_) : to(to_), cap(cap_) {}
    };

    int n;
    std::vector<_Edge> e;
    std::vector<std::vector<int>> g;
    std::vector<int> cur, h;

    // 创建未初始化对象；使用前调用 init
    MaxFlow() {}
    // 创建 n 个点的空网络
    MaxFlow(int n) {
        init(n);
    }

    // 重置为 n 个点的空网络
    void init(int n) {
        this->n = n;
        e.clear();
        g.assign(n, {});
        cur.resize(n);
        h.resize(n);
    }

    // 建立分层图；仅供 flow 调用
    bool bfs(int s, int t) {
        h.assign(n, -1);
        std::queue<int> que;
        h[s] = 0;
        que.push(s);
        while (!que.empty()) {
            const int u = que.front();
            que.pop();
            for (int i : g[u]) {
                auto [v, c] = e[i];
                if (c > 0 && h[v] == -1) {
                    h[v] = h[u] + 1;
                    if (v == t) {
                        return true;
                    }
                    que.push(v);
                }
            }
        }
        return false;
    }

    // 沿分层图增广；仅供 flow 调用
    T dfs(int u, int t, T f) {
        struct Frame {
            int vertex;
            T limit, sent;
            int incoming;
        };
        std::vector<Frame> frames{{u, f, T(0), -1}};
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (vertex == t || frame.sent == frame.limit || cur[vertex] == int(g[vertex].size())) {
                T amount = vertex == t ? frame.limit : frame.sent;
                int incoming = frame.incoming;
                frames.pop_back();
                if (frames.empty())
                    return amount;
                auto &parent = frames.back();
                parent.sent += amount;
                e[incoming].cap -= amount;
                e[incoming ^ 1].cap += amount;
                if (parent.sent < parent.limit)
                    ++cur[parent.vertex];
                continue;
            }
            int edge = g[vertex][cur[vertex]];
            int next = e[edge].to;
            if (e[edge].cap <= 0 || h[next] != h[vertex] + 1) {
                ++cur[vertex];
                continue;
            }
            T limit = std::min(frame.limit - frame.sent, e[edge].cap);
            frames.push_back({next, limit, T(0), edge});
        }
        return T(0);
    }

    // 加入有向容量边
    void addEdge(int u, int v, T c) {
        g[u].push_back(e.size());
        e.emplace_back(v, c);
        g[v].push_back(e.size());
        e.emplace_back(u, 0);
    }

    // 继续增广并返回新增流量
    T flow(int s, int t) {
        T ans = 0;
        while (bfs(s, t)) {
            cur.assign(n, 0);
            ans += dfs(s, t, std::numeric_limits<T>::max());
        }
        return ans;
    }

    // 返回最后一次分层搜索得到的 s 侧点集
    std::vector<bool> minCut() {
        std::vector<bool> c(n);
        for (int i = 0; i < n; i++) {
            c[i] = (h[i] != -1);
        }
        return c;
    }

    // 一条原始有向边及其流量
    struct Edge {
        int from;
        int to;
        T cap;
        T flow;
    };

    // 按加边顺序返回原始边及流量
    std::vector<Edge> edges() {
        std::vector<Edge> a;
        for (int i = 0; i < e.size(); i += 2) {
            Edge x;
            x.from = e[i + 1].to;
            x.to = e[i].to;
            x.cap = e[i].cap + e[i + 1].cap;
            x.flow = e[i + 1].cap;
            a.push_back(x);
        }
        return a;
    }
};
```
