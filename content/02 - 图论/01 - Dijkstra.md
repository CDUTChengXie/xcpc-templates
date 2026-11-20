# Dijkstra

先 `Dijkstra(n)`，用 `addEdge(u,v,w)` 加有向边或 `addUndirectedEdge` 加无向边；加完后 `work(s)`，再读距离或调用 `path(t)`。

有向或无向图，边权非负；有限距离须小于 Dijkstra::INF。 点下标 0..n-1；s 为源点，t 为目标点；不可达距离为 INF、路径为空。 加完边后 work；返回的距离引用在下次 work/init 时更新，parent 中源点和不可达点为 -1。

O((n + m) log n) 时间，O(n + m) 空间。

```cpp
// 单源或多源非负权最短路
struct Dijkstra {
    static constexpr i64 INF = 4E18;

    int n = 0;
    int source = -1;
    std::vector<std::vector<std::pair<int, i64>>> g;
    std::vector<i64> dist;   // work 后，dist[u] 为最近源点到 u 的距离；不可达为 INF
    std::vector<int> parent; // parent[u] 为最短路上的前驱；各源点和不可达点为 -1

    // 创建未初始化对象；使用前调用 init
    Dijkstra() {}
    // 创建 n 个点的空图
    Dijkstra(int n) {
        init(n);
    }

    // 重置为 n 个点的空图
    void init(int n) {
        this->n = n;
        source = -1;
        g.assign(n, {});
        dist.clear();
        parent.clear();
    }

    // 加入一条有向边
    void addEdge(int u, int v, i64 w) {
        g[u].push_back({v, w});
    }

    // 加入一条无向边
    void addUndirectedEdge(int u, int v, i64 w) {
        addEdge(u, v, w);
        addEdge(v, u, w);
    }

    // 返回单源距离数组；结果在下次 work/init 前有效
    const std::vector<i64> &work(int s) {
        return work(std::vector<int>{s});
    }

    // 返回到最近源点的距离；空源集使所有点不可达
    const std::vector<i64> &work(const std::vector<int> &sources) {
        for (int s : sources)
            if (s < 0 || s >= n)
                throw std::out_of_range("source vertex");
        source = sources.empty() ? -1 : sources.front();
        dist.assign(n, INF);
        parent.assign(n, -1);
        std::priority_queue<std::pair<i64, int>, std::vector<std::pair<i64, int>>,
                            std::greater<std::pair<i64, int>>>
            que;
        for (int s : sources) {
            dist[s] = 0;
            que.push({0, s});
        }
        while (!que.empty()) {
            auto [d, u] = que.top();
            que.pop();
            if (d != dist[u]) {
                continue;
            }
            for (auto [v, w] : g[u]) {
                if (w <= INF - d && dist[v] > d + w) {
                    dist[v] = d + w;
                    parent[v] = u;
                    que.push({dist[v], v});
                }
            }
        }
        return dist;
    }

    // 返回最近源点到 t 的路径顶点；未计算或不可达返回空
    std::vector<int> path(int t) const {
        if (source == -1 || dist[t] == INF) {
            return {};
        }
        std::vector<int> p;
        for (int u = t; u != -1; u = parent[u]) {
            p.push_back(u);
        }
        std::reverse(p.begin(), p.end());
        return p;
    }
};
```
