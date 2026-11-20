# 加权DAG最短路与最长路

有向图；n*最大绝对边权 < 10^18；有环时整个求解返回 nullopt。 点 0..n-1；s 为源点，t 为目标点；加完边再 work，可重复计算。 不可达距离为 WeightedDAG::INF（最短）或 -INF（最长），parent 为 -1；源点前驱也为 -1。

Result 的 dist 为距离、parent 为路径前驱、order 为全图拓扑序。

O(n+m) 时间，O(n+m) 空间。

```cpp
// 加权 DAG 单源最短/最长路
class WeightedDAG {
    int n;
    std::vector<std::vector<std::pair<int, i64>>> a;

  public:
    static constexpr i64 INF = i64(4e18);
    // 单源距离、前驱与拓扑序
    struct Result {
        std::vector<i64> dist; // dist[u] 为源点到 u 的距离；不可达时最短路为 INF、最长路为 -INF
        // parent[u] 为路径前驱（源点、不可达点为 -1）；order[i] 为全图拓扑序中的第 i 个点
        std::vector<int> parent, order;
    };
    // 创建 n 个点，点编号 0..n-1
    explicit WeightedDAG(int n) : n(n), a(n) {
        if (n < 0)
            throw std::invalid_argument("negative n");
    }
    // 添加带权有向边；允许负权，无返回值
    void addEdge(int u, int v, i64 w) {
        if (u < 0 || u >= n || v < 0 || v >= n)
            throw std::out_of_range("vertex");
        __int128 abs = w;
        if (abs < 0)
            abs = -abs;
        if (abs * n >= __int128(1000000000000000000LL))
            throw std::overflow_error("weight bound");
        a[u].push_back({v, w});
    }
    // 返回单源距离、前驱和拓扑序；有向环返回空，longest=true求最长路
    std::optional<Result> work(int s, bool longest = false) const {
        if (s < 0 || s >= n)
            throw std::out_of_range("source");
        std::vector<int> deg(n);
        for (auto &row : a)
            for (auto [v, w] : row)
                ++deg[v];
        Result r{std::vector<i64>(n, longest ? -INF : INF), std::vector<int>(n, -1), {}};
        std::queue<int> q;
        for (int u = 0; u < n; ++u)
            if (!deg[u])
                q.push(u);
        r.dist[s] = 0;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            r.order.push_back(u);
            for (auto [v, w] : a[u]) {
                if (r.dist[u] != (longest ? -INF : INF)) {
                    i64 candidate = r.dist[u] + w;
                    if (longest ? candidate > r.dist[v] : candidate < r.dist[v]) {
                        r.dist[v] = candidate;
                        r.parent[v] = u;
                    }
                }
                if (--deg[v] == 0)
                    q.push(v);
            }
        }
        if (int(r.order.size()) != n)
            return std::nullopt;
        return r;
    }
};
```
