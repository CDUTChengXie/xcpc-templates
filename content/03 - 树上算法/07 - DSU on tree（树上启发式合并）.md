# DSU on tree（树上启发式合并）

先建立双向邻接表与颜色数组，构造 `DSUOnTree(n,graph,colors)` 后调用 `solve()`，从 `ans[u]` 读结果。

n>=1 的连通无向树，点 0..n-1，根固定为 0；colors 长度 n，颜色编号在 [0,n]。 ans[u] 是子树内出现次数最多的最小编号颜色；solve 可重复调用并重置状态。

O(n log n) 时间、O(n) 空间

```cpp
// 计算每个子树众数的树上启发式合并
struct DSUOnTree {
    int n;
    std::vector<std::vector<int>> g;
    std::vector<int> col;
    std::vector<int> sz, big;
    std::vector<int> cnt;
    std::vector<int> ans; // solve 后，ans[u] 为 u 子树中出现最多的颜色，并列取颜色编号最小者
    int mxCnt = 0;
    int best = -1;

    // 用图、颜色和大小 n 构造，根固定为 0
    DSUOnTree(int n_, const std::vector<std::vector<int>> &g_, const std::vector<int> &color_)
        : n(n_), g(g_), col(color_), sz(n_, 0), big(n_, -1), cnt(n + 1, 0), ans(n, 0) {}

    // 计算子树大小和重儿子
    void dfsSize(int u, int fa) {
        std::vector<std::pair<int, int>> order{{u, fa}};
        for (size_t index = 0; index < order.size(); ++index) {
            auto [vertex, parent] = order[index];
            sz[vertex] = 1;
            big[vertex] = -1;
            for (int next : g[vertex])
                if (next != parent)
                    order.push_back({next, vertex});
        }
        for (auto iterator = order.rbegin(); iterator != order.rend(); ++iterator) {
            auto [vertex, parent] = *iterator;
            for (int next : g[vertex])
                if (next != parent) {
                    sz[vertex] += sz[next];
                    if (big[vertex] == -1 || sz[next] > sz[big[vertex]])
                        big[vertex] = next;
                }
        }
    }

    // 改变颜色 c 的数量并更新当前众数
    void delta(int c, int d) {
        cnt[c] += d;
        if (d <= 0) {
            return;
        }
        if (cnt[c] > mxCnt || (cnt[c] == mxCnt && (best == -1 || c < best))) {
            mxCnt = cnt[c];
            best = c;
        }
    }

    // 把 u 子树中所有颜色按 d 加入或删除
    void add(int u, int fa, int d) {
        std::vector<std::pair<int, int>> pending{{u, fa}};
        while (!pending.empty()) {
            auto [vertex, parent] = pending.back();
            pending.pop_back();
            delta(col[vertex], d);
            for (int next : g[vertex])
                if (next != parent)
                    pending.push_back({next, vertex});
        }
    }

    // 计算 u 子树的答案；keep 表示是否保留计数
    void dfs(int u, int fa, bool keep) {
        struct Frame {
            int vertex, parent;
            bool keep, finish;
        };
        std::vector<Frame> pending{{u, fa, keep, false}};
        while (!pending.empty()) {
            auto frame = pending.back();
            pending.pop_back();
            int vertex = frame.vertex;
            if (!frame.finish) {
                pending.push_back({vertex, frame.parent, frame.keep, true});
                if (big[vertex] != -1)
                    pending.push_back({big[vertex], vertex, true, false});
                for (auto iterator = g[vertex].rbegin(); iterator != g[vertex].rend(); ++iterator) {
                    int next = *iterator;
                    if (next != frame.parent && next != big[vertex])
                        pending.push_back({next, vertex, false, false});
                }
            } else {
                for (int next : g[vertex]) {
                    if (next != frame.parent && next != big[vertex])
                        add(next, vertex, 1);
                }
                delta(col[vertex], 1);
                ans[vertex] = best;
                if (!frame.keep) {
                    add(vertex, frame.parent, -1);
                    mxCnt = 0;
                    best = -1;
                }
            }
        }
    }

    // 重置并计算根 0 下的全部答案
    void solve() {
        std::fill(sz.begin(), sz.end(), 0);
        std::fill(big.begin(), big.end(), -1);
        std::fill(cnt.begin(), cnt.end(), 0);
        std::fill(ans.begin(), ans.end(), 0);
        mxCnt = 0;
        best = -1;
        if (n > 0) {
            dfsSize(0, -1);
            dfs(0, -1, true);
        }
    }
};
```
