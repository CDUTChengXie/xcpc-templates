# Prim 最小生成树

邻接表每条边双向加入，点下标 0..n-1；边权绝对值之和小于 2^59。结果 parent 的根 0 为 -1，不连通返回 nullopt；n=0 时总权为 0。

O((n+m) log n) 时间，O(n+m) 空间。

```cpp
namespace GraphExtra {
    // 最小生成树结果
    struct MSTResult {
        i64 weight;
        std::vector<int> parent; // parent[u] 为最小生成树中 u 的父节点；根 0 为 -1
    };
    // 无向图最小生成树；返回总权值和父节点，不连通返回 nullopt
    inline std::optional<MSTResult> prim(const std::vector<std::vector<std::pair<int, i64>>> &adj) {
        int n = int(adj.size());
        if (n == 0)
            return MSTResult{0, {}};
        std::vector<bool> used(n);
        std::vector<i64> best(n, (1LL << 60));
        std::vector<int> parent(n, -1);
        std::priority_queue<std::pair<i64, int>, std::vector<std::pair<i64, int>>,
                            std::greater<std::pair<i64, int>>>
            q;
        q.push({0, 0});
        best[0] = 0;
        i64 total = 0;
        int count = 0;
        while (!q.empty()) {
            auto [w, u] = q.top();
            q.pop();
            if (used[u])
                continue;
            used[u] = true;
            total += w;
            ++count;
            for (auto [v, cost] : adj[u]) {
                assert(v >= 0 && v < n);
                if (!used[v] && cost < best[v]) {
                    best[v] = cost;
                    parent[v] = u;
                    q.push({cost, v});
                }
            }
        }
        if (count != n)
            return std::nullopt;
        return MSTResult{total, parent};
    }
}
```

## 二分图染色

邻接表每条边双向加入，点下标 0..n-1；支持不连通图，有冲突返回 nullopt。可独立复制。

O(n+m) 时间，O(n) 额外空间。

```cpp
namespace GraphExtra {
    // 无向图二分染色；返回每点的 0/1 颜色，不能分成二分图返回 nullopt
    inline std::optional<std::vector<int>> bipartite(const std::vector<std::vector<int>> &adj) {
        int n = int(adj.size());
        std::vector<int> color(n, -1);
        for (int s = 0; s < n; ++s)
            if (color[s] == -1) {
                std::queue<int> q;
                q.push(s);
                color[s] = 0;
                while (!q.empty()) {
                    int u = q.front();
                    q.pop();
                    for (int v : adj[u]) {
                        assert(v >= 0 && v < n);
                        if (color[v] == -1) {
                            color[v] = color[u] ^ 1;
                            q.push(v);
                        } else if (color[v] == color[u])
                            return std::nullopt;
                    }
                }
            }
        return color;
    }
}
```

## BFS 无权最短路

适用于有向或无向图，点下标 0..n-1；source 必须合法，不可达返回 -1。可独立复制。

O(n+m) 时间，O(n) 额外空间。

```cpp
namespace GraphExtra {
    // 无权图从 source 出发；返回最少边数，不可达为 -1
    inline std::vector<int> bfs(const std::vector<std::vector<int>> &adj, int source) {
        assert(source >= 0 && source < int(adj.size()));
        std::vector<int> d(adj.size(), -1);
        d[source] = 0;
        std::queue<int> q;
        q.push(source);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u]) {
                assert(v >= 0 && v < int(adj.size()));
                if (d[v] == -1) {
                    d[v] = d[u] + 1;
                    q.push(v);
                }
            }
        }
        return d;
    }
}
```

## 位集传递闭包

点下标 0..n-1；返回 reach[u][v/64] 的第 v%64 位表示 u 能到 v。可独立复制。

O(n³/64+n²) 时间，O(n²/64) 空间。

```cpp
namespace GraphExtra {
    // 有向图可达性；reachable[u][v/64] 的第 v%64 位表示 u 能到 v，包含自身
    inline std::vector<std::vector<u64>> closure(const std::vector<std::vector<int>> &adj) {
        int n = int(adj.size()), words = (n + 63) / 64;
        std::vector<std::vector<u64>> reach(n, std::vector<u64>(words));
        for (int u = 0; u < n; ++u) {
            reach[u][u / 64] |= u64(1) << (u % 64);
            for (int v : adj[u]) {
                assert(v >= 0 && v < n);
                reach[u][v / 64] |= u64(1) << (v % 64);
            }
        }
        for (int k = 0; k < n; ++k)
            for (int u = 0; u < n; ++u)
                if (reach[u][k / 64] >> (k % 64) & 1)
                    for (int w = 0; w < words; ++w)
                        reach[u][w] |= reach[k][w];
        return reach;
    }
}
```
