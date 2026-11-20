# 全局最小割与最小割树（Stoer-Wagner 与 Gomory-Hu）

无向边权非负，权值累加不得溢出且割值小于统一主模板 INF；输入边自环应忽略。 点下标 0..n-1；Stoer-Wagner 用零对角对称矩阵，可不连通，n<2 或不连通返回 0。 Gomory-Hu 边列表每条无向边只输入一次，重边允许；返回 {端点,端点,割值} 的 n-1 条树边。

两点查询在建树后进行，不连通两点割值为 0，同点为 INF。

Stoer-Wagner O(n^3)；Gomory-Hu O(n) 次最大流；单次查询 O(n)；空间 O(n^2+m)。

```cpp
// 返回无向图的全局最小割权值；不连通或不足两点时为 0
i64 stoerWagner(std::vector<std::vector<i64>> g) {
    int n = (int)g.size();
    if (n < 2) {
        return 0;
    }
    std::vector<int> verts(n);
    for (int i = 0; i < n; i++) {
        verts[i] = i;
    }
    i64 best = INF;
    while (verts.size() > 1) {
        int m = (int)verts.size();
        std::vector<i64> w(m, 0); // w[k] = 第 k 个点与已加入集合的边权和
        std::vector<char> added(m, false);
        int prev = -1, last = -1, lastPrev = -1;
        for (int step = 0; step < m; step++) {
            int sel = -1;
            for (int k = 0; k < m; k++) {
                if (!added[k] && (sel == -1 || w[k] > w[sel])) {
                    sel = k;
                }
            }
            added[sel] = true;
            lastPrev = prev;
            last = sel;
            prev = sel;
            if (step == m - 1) {
                break;
            }
            for (int k = 0; k < m; k++) {
                if (!added[k]) {
                    w[k] += g[verts[sel]][verts[k]];
                }
            }
        }
        // w[last] 就是本轮的割值；s = verts[lastPrev], t = verts[last]
        best = std::min(best, w[last]);
        int s = verts[lastPrev], t = verts[last];
        if (s == -1) {
            break;
        }
        // 把 s 合并进 t：g[t][v] += g[s][v]
        for (int v : verts) {
            if (v == s || v == t) {
                continue;
            }
            g[t][v] += g[s][v];
            g[v][t] = g[t][v];
        }
        verts.erase(std::find(verts.begin(), verts.end(), s));
    }
    return best;
}

// Gomory-Hu 使用的 Dinic 最大流
struct DinicForGH {
    // 内部残量边
    struct E {
        int to, rev;
        i64 cap;
    };
    int n;
    std::vector<std::vector<E>> g;
    std::vector<int> lvl, it;

    // 创建 n 个点的空网络
    explicit DinicForGH(int n) : n(n), g(n), lvl(n), it(n) {}

    // 加入有向容量边
    void addEdge(int u, int v, i64 c) {
        E a{v, (int)g[v].size(), c};
        E b{u, (int)g[u].size(), 0};
        g[u].push_back(a);
        g[v].push_back(b);
    }

    // 建立分层图
    bool bfs(int s, int t) {
        std::fill(lvl.begin(), lvl.end(), -1);
        std::queue<int> q;
        lvl[s] = 0;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (auto &e : g[u]) {
                if (e.cap > 0 && lvl[e.to] < 0) {
                    lvl[e.to] = lvl[u] + 1;
                    q.push(e.to);
                }
            }
        }
        return lvl[t] >= 0;
    }

    // 沿分层图增广
    i64 dfs(int u, int t, i64 f) {
        std::vector<int> vertices{u}, chosen;
        std::vector<i64> limits{f};
        while (!vertices.empty()) {
            int vertex = vertices.back();
            if (vertex == t) {
                i64 amount = limits.back();
                for (size_t index = 0; index < chosen.size(); ++index) {
                    auto &edge = g[vertices[index]][chosen[index]];
                    edge.cap -= amount;
                    g[edge.to][edge.rev].cap += amount;
                }
                return amount;
            }
            while (it[vertex] < int(g[vertex].size())) {
                const auto &edge = g[vertex][it[vertex]];
                if (edge.cap > 0 && lvl[edge.to] == lvl[vertex] + 1)
                    break;
                ++it[vertex];
            }
            if (it[vertex] == int(g[vertex].size())) {
                vertices.pop_back();
                limits.pop_back();
                if (!chosen.empty()) {
                    chosen.pop_back();
                    ++it[vertices.back()];
                }
            } else {
                const auto &edge = g[vertex][it[vertex]];
                chosen.push_back(it[vertex]);
                limits.push_back(std::min(limits.back(), edge.cap));
                vertices.push_back(edge.to);
            }
        }
        return 0;
    }

    // 返回新增最大流量
    i64 maxflow(int s, int t) {
        i64 f = 0;
        while (bfs(s, t)) {
            std::fill(it.begin(), it.end(), 0);
            while (true) {
                i64 d = dfs(s, t, INF);
                if (d == 0) {
                    break;
                }
                f += d;
            }
        }
        return f;
    }

    // 返回残量图上从 s 可达的点
    std::vector<char> reachable(int s) {
        std::vector<char> vis(n, false);
        std::queue<int> q;
        vis[s] = 1;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (auto &e : g[u]) {
                if (e.cap > 0 && !vis[e.to]) {
                    vis[e.to] = 1;
                    q.push(e.to);
                }
            }
        }
        return vis;
    }
};

// 返回 n-1 条边的最小割树
std::vector<std::tuple<int, int, i64>>
gomoryHu(int n, const std::vector<std::tuple<int, int, i64>> &edges) {
    std::vector<int> par(n, 0);
    std::vector<i64> wt(n, 0);
    for (int s = 1; s < n; s++) {
        int t = par[s];
        DinicForGH d(n);
        for (auto &[a, b, c] : edges) {
            d.addEdge(a, b, c);
            d.addEdge(b, a, c); // 无向图：加反向同容量的边
        }
        i64 f = d.maxflow(s, t);
        auto vis = d.reachable(s);
        // 把 s 侧里那些父亲同为 t 的点改挂到 s 下面
        for (int i = s + 1; i < n; i++) {
            if (vis[i] && par[i] == t) {
                par[i] = s;
            }
        }
        // 标准 GH 的交换步骤：t 不是根且 t 的父亲落在 s 侧时，交换 s、t 的位置并搬移边权
        if (t != 0 && vis[par[t]]) {
            par[s] = par[t];
            par[t] = s;
            wt[s] = wt[t];
            wt[t] = f;
        } else {
            wt[s] = f;
        }
    }
    std::vector<std::tuple<int, int, i64>> tree;
    for (int i = 1; i < n; i++) {
        tree.emplace_back(i, par[i], wt[i]);
    }
    return tree;
}

// 返回最小割树上两点间的最小割，u==v 时为 INF
i64 gomoryHuQuery(int n, const std::vector<std::tuple<int, int, i64>> &tree, int u, int v) {
    std::vector<std::vector<std::pair<int, i64>>> adj(n);
    for (auto &[a, b, w] : tree) {
        adj[a].push_back({b, w});
        adj[b].push_back({a, w});
    }
    std::vector<i64> best(n, INF);
    best[u] = INF;
    std::vector<char> vis(n, false);
    std::vector<int> st{u};
    vis[u] = true;
    while (!st.empty()) {
        int x = st.back();
        st.pop_back();
        for (auto &[y, w] : adj[x]) {
            if (!vis[y]) {
                vis[y] = true;
                best[y] = std::min(best[x], w);
                st.push_back(y);
            }
        }
    }
    return best[v];
}
```
